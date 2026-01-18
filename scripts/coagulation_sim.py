#!/usr/bin/env python3
"""
Simulator Cascada Coagulării
============================
Model ODE bazat pe cinetica Michaelis-Menten cu rate constants din literatura medicală.

Referințe:
- Hockin MF et al. (2002) J Biol Chem 277:18322
- Mann KG et al. (2003) Chest 124:4S
- Butenas S et al. (1999) Biochemistry 38:12362
- Weisel JW (2005) Biophys Chem 112:267

Autor: HemoSim Project
"""

import numpy as np
from scipy.integrate import solve_ivp
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import json


@dataclass
class SimulationResult:
    """Container pentru rezultatele simulării."""
    time: np.ndarray
    concentrations: Dict[str, np.ndarray]
    scenario: str
    parameters: Dict


class CoagulationSimulator:
    """
    Simulator pentru cascada de coagulare folosind ecuații diferențiale.

    Modelează:
    - Calea extrinsecă (inițiere TF-VIIa)
    - Calea intrinsecă (propagare via Tenază)
    - Calea comună (amplificare via Protrombinază)
    - Feedback pozitiv (trombina activează V, VIII, XI)
    - Inhibitori naturali (AT, TFPI, APC)
    - Fibrinoliză (opțional)
    """

    # Indici pentru vectorul de stare
    SPECIES = [
        'TF', 'VII', 'TF_VIIa',  # Extrinsecă
        'XII', 'XIIa', 'XI', 'XIa', 'IX', 'IXa',  # Intrinsecă
        'VIII', 'VIIIa', 'X', 'Xa',  # Tenază → Xa
        'V', 'Va', 'II', 'IIa',  # Protrombinază → Trombină
        'Fbg', 'Fibrin',  # Fibrină
        'XIII', 'XIIIa',  # Stabilizare
        'AT', 'TFPI',  # Inhibitori
        'PC', 'APC', 'PS',  # Proteina C
    ]

    def __init__(self):
        """Inițializează simulatorul cu parametri fiziologici."""
        self.species_idx = {s: i for i, s in enumerate(self.SPECIES)}
        self.n_species = len(self.SPECIES)

        # Concentrații inițiale fiziologice (nM)
        self.initial_concentrations = {
            'TF': 0.0,        # Se adaugă ca trigger
            'VII': 10.0,
            'TF_VIIa': 0.0,
            'XII': 375.0,
            'XIIa': 0.0,
            'XI': 30.0,
            'XIa': 0.0,
            'IX': 90.0,
            'IXa': 0.0,
            'VIII': 0.7,
            'VIIIa': 0.0,
            'X': 170.0,
            'Xa': 0.0,
            'V': 20.0,
            'Va': 0.0,
            'II': 1400.0,     # Protrombină
            'IIa': 0.0,       # Trombină
            'Fbg': 9000.0,    # Fibrinogen
            'Fibrin': 0.0,
            'XIII': 70.0,
            'XIIIa': 0.0,
            'AT': 3400.0,     # Antitrombina
            'TFPI': 2.5,
            'PC': 65.0,
            'APC': 0.0,
            'PS': 300.0,
        }

        # Rate constants (s⁻¹ sau nM⁻¹·s⁻¹)
        # Valorile sunt scalate pentru stabilitate numerică
        self.k = {
            # Formarea complexului TF-VIIa
            'tf_viia_on': 1e-2,      # TF + VII → TF-VIIa
            'tf_viia_off': 1e-4,     # TF-VIIa → TF + VII

            # TF-VIIa activează X și IX (inițiere)
            'tfviia_x': 5e-4,        # TF-VIIa + X → Xa
            'tfviia_ix': 1e-4,       # TF-VIIa + IX → IXa (Josso loop)

            # Contact activation (intrinsecă)
            'xii_auto': 1e-5,        # XII → XIIa (autoactivare lentă)
            'xiia_xi': 5e-4,         # XIIa + XI → XIa
            'xia_ix': 1e-3,          # XIa + IX → IXa

            # Tenază (IXa + VIIIa) - 50-100x mai eficientă decât TF-VIIa
            'tenase_x': 1.0,         # Tenază + X → Xa (amplificat)
            'km_tenase': 10.0,       # Km pentru X

            # Protrombinază (Xa + Va) - foarte eficientă
            'ptase_ii': 10.0,        # Protrombinază + II → IIa (amplificat)
            'km_ptase': 50.0,        # Km pentru II

            # Trombină (IIa) activează
            'iia_fbg': 0.1,          # IIa + Fbg → Fibrin
            'iia_xiii': 0.05,        # IIa + XIII → XIIIa
            'iia_v': 0.5,            # IIa + V → Va (feedback - critic!)
            'iia_viii': 1.0,         # IIa + VIII → VIIIa (feedback - critic!)
            'iia_xi': 0.01,          # IIa + XI → XIa (feedback)

            # Xa poate activa direct V și VIII (mai lent decât IIa)
            'xa_v': 0.01,            # Xa + V → Va (inițiere)
            'xa_viii': 0.005,        # Xa + VIII → VIIIa (inițiere)

            # Conversie bazală II → IIa (Xa singur, fără Va)
            'xa_ii_basal': 1e-4,     # Xa + II → IIa (lent dar semnificativ)

            # Inhibitori (rate mai mici pentru a permite burst)
            'at_iia': 1e-4,          # AT + IIa → inactiv
            'at_xa': 5e-5,           # AT + Xa → inactiv
            'at_ixa': 1e-5,          # AT + IXa → inactiv
            'at_xia': 5e-6,          # AT + XIa → inactiv
            'tfpi_xa': 1e-4,         # TFPI + Xa → inactiv
            'tfpi_tfviia': 5e-4,     # TFPI-Xa + TF-VIIa → inactiv

            # Proteina C
            'iia_pc': 1e-4,          # IIa (pe TM) + PC → APC
            'apc_va': 5e-3,          # APC + Va → inactiv
            'apc_viiia': 1e-2,       # APC + VIIIa → inactiv
        }

        # Parametri Michaelis-Menten
        self.Km = {
            'tenase_x': 160.0,
            'ptase_ii': 210.0,
            'iia_fbg': 7200.0,
        }

    def get_initial_state(self, modifications: Optional[Dict[str, float]] = None) -> np.ndarray:
        """
        Creează vectorul de stare inițial.

        Args:
            modifications: Dict cu modificări de concentrații (ex: {'VIII': 0} pentru Hemofilia A)

        Returns:
            Vector numpy cu concentrațiile inițiale
        """
        y0 = np.zeros(self.n_species)

        for species, conc in self.initial_concentrations.items():
            if species in self.species_idx:
                y0[self.species_idx[species]] = conc

        # Aplică modificări
        if modifications:
            for species, conc in modifications.items():
                if species in self.species_idx:
                    y0[self.species_idx[species]] = conc

        return y0

    def derivatives(self, t: float, y: np.ndarray, params: Dict) -> np.ndarray:
        """
        Calculează derivatele pentru toate speciile.

        Ecuațiile diferențiale modelează:
        1. Formarea complexelor (TF-VIIa, Tenază, Protrombinază)
        2. Activarea secvențială a factorilor
        3. Feedback pozitiv
        4. Inhibiție
        """
        # Extrage concentrațiile (cu protecție pentru valori negative)
        y = np.maximum(y, 0)

        TF = y[self.species_idx['TF']]
        VII = y[self.species_idx['VII']]
        TF_VIIa = y[self.species_idx['TF_VIIa']]
        XII = y[self.species_idx['XII']]
        XIIa = y[self.species_idx['XIIa']]
        XI = y[self.species_idx['XI']]
        XIa = y[self.species_idx['XIa']]
        IX = y[self.species_idx['IX']]
        IXa = y[self.species_idx['IXa']]
        VIII = y[self.species_idx['VIII']]
        VIIIa = y[self.species_idx['VIIIa']]
        X = y[self.species_idx['X']]
        Xa = y[self.species_idx['Xa']]
        V = y[self.species_idx['V']]
        Va = y[self.species_idx['Va']]
        II = y[self.species_idx['II']]
        IIa = y[self.species_idx['IIa']]
        Fbg = y[self.species_idx['Fbg']]
        Fibrin = y[self.species_idx['Fibrin']]
        XIII = y[self.species_idx['XIII']]
        XIIIa = y[self.species_idx['XIIIa']]
        AT = y[self.species_idx['AT']]
        TFPI = y[self.species_idx['TFPI']]
        PC = y[self.species_idx['PC']]
        APC = y[self.species_idx['APC']]

        k = self.k

        # Modificatori pentru scenarii
        at_factor = params.get('at_factor', 1.0)  # Heparină: 100x
        xa_inhibition = params.get('xa_inhibition', 1.0)  # DOACs: 0.05-0.1
        iia_inhibition = params.get('iia_inhibition', 1.0)  # Dabigatran: 0.05

        # === RATE DE REACȚIE ===

        # Formarea TF-VIIa
        r_tfviia_form = k['tf_viia_on'] * TF * VII
        r_tfviia_diss = k['tf_viia_off'] * TF_VIIa

        # TF-VIIa activează X și IX (INIȚIERE)
        r_tfviia_x = k['tfviia_x'] * TF_VIIa * X
        r_tfviia_ix = k['tfviia_ix'] * TF_VIIa * IX

        # Contact activation
        r_xii_auto = k['xii_auto'] * XII
        r_xiia_xi = k['xiia_xi'] * XIIa * XI
        r_xia_ix = k['xia_ix'] * XIa * IX

        # Tenază (IXa + VIIIa) - cinetică Michaelis-Menten
        tenase_activity = IXa * VIIIa / (1 + VIIIa)  # VIIIa ca cofactor
        r_tenase_x = k['tenase_x'] * tenase_activity * X / (self.Km['tenase_x'] + X)

        # Protrombinază (Xa + Va) - cinetică Michaelis-Menten
        # Xa efectiv = Xa * xa_inhibition (DOACs anti-Xa reduc activitatea)
        Xa_effective = Xa * xa_inhibition
        ptase_activity = Xa_effective * Va / (1 + Va)  # Va ca cofactor
        r_ptase_ii = k['ptase_ii'] * ptase_activity * II / (self.Km['ptase_ii'] + II)

        # Trombină activează
        # IIa efectiv = IIa * iia_inhibition (Dabigatran reduce activitatea trombinei)
        IIa_effective = IIa * iia_inhibition
        r_iia_fbg = k['iia_fbg'] * IIa_effective * Fbg / (self.Km['iia_fbg'] + Fbg)
        r_iia_xiii = k['iia_xiii'] * IIa_effective * XIII
        r_iia_v = k['iia_v'] * IIa_effective * V      # Feedback
        r_iia_viii = k['iia_viii'] * IIa_effective * VIII  # Feedback
        r_iia_xi = k['iia_xi'] * IIa_effective * XI   # Feedback

        # Xa activează direct V și VIII (inițierea feedback-ului)
        r_xa_v = k['xa_v'] * Xa * V
        r_xa_viii = k['xa_viii'] * Xa * VIII

        # Conversie bazală II → IIa de către Xa singur (fără Va)
        r_xa_ii_basal = k['xa_ii_basal'] * Xa * II

        # Inhibiție
        r_at_iia = k['at_iia'] * AT * IIa * at_factor
        r_at_xa = k['at_xa'] * AT * Xa * at_factor
        r_at_ixa = k['at_ixa'] * AT * IXa * at_factor
        r_at_xia = k['at_xia'] * AT * XIa * at_factor
        r_tfpi_xa = k['tfpi_xa'] * TFPI * Xa
        r_tfpi_tfviia = k['tfpi_tfviia'] * TFPI * TF_VIIa * Xa  # Necesită Xa

        # Proteina C
        r_iia_pc = k['iia_pc'] * IIa * PC  # Simplificat (fără TM explicit)
        r_apc_va = k['apc_va'] * APC * Va
        r_apc_viiia = k['apc_viiia'] * APC * VIIIa

        # === DERIVATE ===
        dydt = np.zeros(self.n_species)

        # TF (constant după adăugare)
        dydt[self.species_idx['TF']] = -r_tfviia_form + r_tfviia_diss

        # VII
        dydt[self.species_idx['VII']] = -r_tfviia_form + r_tfviia_diss

        # TF-VIIa
        dydt[self.species_idx['TF_VIIa']] = r_tfviia_form - r_tfviia_diss - r_tfpi_tfviia

        # XII, XIIa
        dydt[self.species_idx['XII']] = -r_xii_auto
        dydt[self.species_idx['XIIa']] = r_xii_auto

        # XI, XIa
        dydt[self.species_idx['XI']] = -r_xiia_xi - r_iia_xi
        dydt[self.species_idx['XIa']] = r_xiia_xi + r_iia_xi - r_at_xia

        # IX, IXa
        dydt[self.species_idx['IX']] = -r_tfviia_ix - r_xia_ix
        dydt[self.species_idx['IXa']] = r_tfviia_ix + r_xia_ix - r_at_ixa

        # VIII, VIIIa
        dydt[self.species_idx['VIII']] = -r_iia_viii - r_xa_viii
        dydt[self.species_idx['VIIIa']] = r_iia_viii + r_xa_viii - r_apc_viiia

        # X, Xa
        dydt[self.species_idx['X']] = -r_tfviia_x - r_tenase_x
        dydt[self.species_idx['Xa']] = r_tfviia_x + r_tenase_x - r_at_xa - r_tfpi_xa

        # V, Va
        dydt[self.species_idx['V']] = -r_iia_v - r_xa_v
        dydt[self.species_idx['Va']] = r_iia_v + r_xa_v - r_apc_va

        # II, IIa (Protrombină, Trombină)
        dydt[self.species_idx['II']] = -r_ptase_ii - r_xa_ii_basal
        dydt[self.species_idx['IIa']] = r_ptase_ii + r_xa_ii_basal - r_at_iia

        # Fibrinogen, Fibrin
        dydt[self.species_idx['Fbg']] = -r_iia_fbg
        dydt[self.species_idx['Fibrin']] = r_iia_fbg

        # XIII, XIIIa
        dydt[self.species_idx['XIII']] = -r_iia_xiii
        dydt[self.species_idx['XIIIa']] = r_iia_xiii

        # AT (se consumă)
        dydt[self.species_idx['AT']] = -(r_at_iia + r_at_xa + r_at_ixa + r_at_xia)

        # TFPI (se consumă)
        dydt[self.species_idx['TFPI']] = -r_tfpi_xa - r_tfpi_tfviia

        # PC, APC
        dydt[self.species_idx['PC']] = -r_iia_pc
        dydt[self.species_idx['APC']] = r_iia_pc

        return dydt

    def simulate(
        self,
        scenario: str = 'normal',
        t_end: float = 600.0,
        t_points: int = 1000,
        tf_concentration: float = 25.0,
    ) -> SimulationResult:
        """
        Rulează simularea pentru un scenariu dat.

        Args:
            scenario: Scenariul de simulat (vezi lista mai jos)
            t_end: Timp final (secunde)
            t_points: Număr de puncte de timp
            tf_concentration: Concentrație TF pentru trigger (nM)

        Scenarii disponibile:
            - 'normal': Coagulare normală
            - 'hemophilia_a': Deficit Factor VIII (0%)
            - 'hemophilia_b': Deficit Factor IX (0%)
            - 'warfarin': VKA - reduce II, VII, IX, X cu 70%
            - 'heparin_ufh': Heparină nefracționată (AT 100x)
            - 'heparin_lmwh': Heparină cu greutate moleculară mică (anti-Xa predominant)
            - 'rivaroxaban': DOAC - inhibitor direct Xa
            - 'dabigatran': DOAC - inhibitor direct IIa
            - 'apixaban': DOAC - inhibitor direct Xa (similar rivaroxaban)
            - 'fviii_concentrate': Tratament hemofilie A cu concentrat FVIII
            - 'fix_concentrate': Tratament hemofilie B cu concentrat FIX
            - 'pcc': Prothrombin Complex Concentrate (II, VII, IX, X elevate)
            - 'ffp': Fresh Frozen Plasma (toate factori ușor crescute)
            - 'dic': Coagulare intravasculară diseminată
            - 'liver_disease': Insuficiență hepatică
            - 'vwd_type1': von Willebrand Disease tip 1

        Returns:
            SimulationResult cu toate datele
        """
        # Configurare scenariu
        modifications = {}
        params = {'at_factor': 1.0, 'xa_inhibition': 1.0, 'iia_inhibition': 1.0}

        if scenario == 'normal':
            pass  # Folosește valorile default

        elif scenario == 'hemophilia_a':
            modifications['VIII'] = 0.0  # Lipsă Factor VIII

        elif scenario == 'hemophilia_b':
            modifications['IX'] = 0.0  # Lipsă Factor IX

        elif scenario == 'warfarin':
            # Reduce factorii vitamina K dependenți cu 70%
            for factor in ['II', 'VII', 'IX', 'X', 'PC']:
                modifications[factor] = self.initial_concentrations.get(factor, 0) * 0.3

        elif scenario == 'heparin' or scenario == 'heparin_ufh':
            # Heparină nefracționată - potențează AT pentru IIa și Xa
            params['at_factor'] = 100.0

        elif scenario == 'heparin_lmwh':
            # LMWH - predominant anti-Xa (raport anti-Xa:anti-IIa = 3:1)
            params['at_factor'] = 30.0  # Mai slab decât UFH
            params['xa_inhibition'] = 0.2  # Inhibiție directă Xa suplimentară

        elif scenario == 'rivaroxaban':
            # DOAC - inhibitor direct și reversibil al Xa
            # IC50 ~ 0.7 nM, concentrație terapeutică ~ 200-400 nM
            params['xa_inhibition'] = 0.05  # 95% inhibiție Xa

        elif scenario == 'dabigatran':
            # DOAC - inhibitor direct și reversibil al IIa (trombinei)
            # Ki ~ 4.5 nM, concentrație terapeutică ~ 100-400 nM
            params['iia_inhibition'] = 0.05  # 95% inhibiție IIa

        elif scenario == 'apixaban':
            # DOAC - inhibitor direct Xa (similar rivaroxaban dar mai selectiv)
            params['xa_inhibition'] = 0.08  # 92% inhibiție Xa

        elif scenario == 'fviii_concentrate':
            # Tratament hemofilie A cu concentrat FVIII
            # Presupunem pacient cu hemofilie A care primește concentrat
            modifications['VIII'] = 0.0  # Pacient hemofilie A
            modifications['VIII'] = 0.7  # După administrare concentrat (nivel normal)

        elif scenario == 'fix_concentrate':
            # Tratament hemofilie B cu concentrat FIX
            modifications['IX'] = 0.0  # Pacient hemofilie B
            modifications['IX'] = 90.0  # După administrare concentrat (nivel normal)

        elif scenario == 'pcc':
            # Prothrombin Complex Concentrate (Beriplex, Octaplex)
            # Conține II, VII, IX, X în concentrații mari
            # Folosit pentru reversarea warfarinei sau deficiențe multiple
            modifications['II'] = self.initial_concentrations['II'] * 1.5
            modifications['VII'] = self.initial_concentrations['VII'] * 2.0
            modifications['IX'] = self.initial_concentrations['IX'] * 1.5
            modifications['X'] = self.initial_concentrations['X'] * 1.5

        elif scenario == 'ffp':
            # Fresh Frozen Plasma - crește moderat toți factorii
            for factor in ['II', 'V', 'VII', 'VIII', 'IX', 'X', 'XI', 'Fbg']:
                if factor in self.initial_concentrations:
                    modifications[factor] = self.initial_concentrations[factor] * 1.2

        elif scenario == 'dic':
            # Coagulare intravasculară diseminată - consum masiv de factori
            modifications['II'] = self.initial_concentrations['II'] * 0.3
            modifications['V'] = self.initial_concentrations['V'] * 0.2
            modifications['VIII'] = self.initial_concentrations['VIII'] * 0.2
            modifications['Fbg'] = self.initial_concentrations['Fbg'] * 0.2
            modifications['AT'] = self.initial_concentrations['AT'] * 0.3

        elif scenario == 'liver_disease':
            # Insuficiență hepatică - scade sinteza hepatică a factorilor
            # Afectează: II, V, VII, IX, X, XI, fibrinogen, AT, PC
            for factor in ['II', 'VII', 'IX', 'X', 'XI', 'AT', 'PC']:
                modifications[factor] = self.initial_concentrations.get(factor, 0) * 0.4
            modifications['V'] = self.initial_concentrations['V'] * 0.5
            modifications['Fbg'] = self.initial_concentrations['Fbg'] * 0.6

        elif scenario == 'vwd_type1':
            # von Willebrand Disease tip 1 - deficit parțial vWF
            # vWF stabilizează FVIII, deci FVIII scăzut secundar
            modifications['VIII'] = self.initial_concentrations['VIII'] * 0.3

        # Adaugă TF ca trigger
        modifications['TF'] = tf_concentration

        # Stare inițială
        y0 = self.get_initial_state(modifications)

        # Interval de timp
        t_span = (0, t_end)
        t_eval = np.linspace(0, t_end, t_points)

        # Rezolvă ODE
        solution = solve_ivp(
            lambda t, y: self.derivatives(t, y, params),
            t_span,
            y0,
            method='LSODA',  # Robust pentru sisteme stiff
            t_eval=t_eval,
            rtol=1e-6,
            atol=1e-9,
        )

        # Extrage rezultatele
        concentrations = {}
        for species in self.SPECIES:
            idx = self.species_idx[species]
            concentrations[species] = solution.y[idx]

        return SimulationResult(
            time=solution.t,
            concentrations=concentrations,
            scenario=scenario,
            parameters={'tf_concentration': tf_concentration, **params, **modifications}
        )

    def plot_thrombin_generation(
        self,
        results: List[SimulationResult],
        title: str = "Thrombin Generation Curve",
        save_path: Optional[str] = None
    ) -> None:
        """
        Plotează curba de generare a trombinei pentru multiple scenarii.
        """
        fig, ax = plt.subplots(figsize=(10, 6))

        colors = {
            'normal': '#2563eb',
            'hemophilia_a': '#dc2626',
            'hemophilia_b': '#f97316',
            'warfarin': '#8b5cf6',
            'heparin': '#10b981',
            'heparin_ufh': '#10b981',
            'heparin_lmwh': '#059669',
            'rivaroxaban': '#0891b2',
            'dabigatran': '#7c3aed',
            'apixaban': '#0284c7',
            'fviii_concentrate': '#65a30d',
            'fix_concentrate': '#84cc16',
            'pcc': '#eab308',
            'ffp': '#f59e0b',
            'dic': '#6b7280',
            'liver_disease': '#a8a29e',
            'vwd_type1': '#f43f5e',
        }

        labels = {
            'normal': 'Normal',
            'hemophilia_a': 'Hemofilia A (VIII=0)',
            'hemophilia_b': 'Hemofilia B (IX=0)',
            'warfarin': 'Warfarină (VKA 70%↓)',
            'heparin': 'Heparină UFH (AT 100x)',
            'heparin_ufh': 'Heparină UFH (AT 100x)',
            'heparin_lmwh': 'LMWH (anti-Xa)',
            'rivaroxaban': 'Rivaroxaban (anti-Xa)',
            'dabigatran': 'Dabigatran (anti-IIa)',
            'apixaban': 'Apixaban (anti-Xa)',
            'fviii_concentrate': 'Concentrat FVIII',
            'fix_concentrate': 'Concentrat FIX',
            'pcc': 'PCC (II,VII,IX,X)',
            'ffp': 'FFP (plasmă proaspătă)',
            'dic': 'DIC (consum factori)',
            'liver_disease': 'Insuficiență hepatică',
            'vwd_type1': 'von Willebrand tip 1',
        }

        for result in results:
            color = colors.get(result.scenario, '#000000')
            label = labels.get(result.scenario, result.scenario)
            ax.plot(
                result.time,
                result.concentrations['IIa'],
                color=color,
                linewidth=2,
                label=label
            )

        ax.set_xlabel('Timp (secunde)', fontsize=12)
        ax.set_ylabel('Trombină [IIa] (nM)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.legend(loc='upper right')
        ax.grid(True, alpha=0.3)
        ax.set_xlim(0, results[0].time[-1])
        ax.set_ylim(0, None)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"Grafic salvat: {save_path}")

        # plt.show()  # Disabled for non-interactive mode

    def plot_cascade_overview(
        self,
        result: SimulationResult,
        save_path: Optional[str] = None
    ) -> None:
        """
        Plotează o vedere de ansamblu a cascadei cu factori cheie.
        """
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))

        t = result.time
        c = result.concentrations

        # Panel 1: Inițiere (TF-VIIa, Xa inițial)
        ax1 = axes[0, 0]
        ax1.plot(t, c['TF_VIIa'], 'g-', linewidth=2, label='TF-VIIa')
        ax1.plot(t, c['Xa'], 'r-', linewidth=2, label='Xa')
        ax1.set_title('INIȚIERE (Calea Extrinsecă)', fontweight='bold')
        ax1.set_xlabel('Timp (s)')
        ax1.set_ylabel('Concentrație (nM)')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Panel 2: Propagare (IXa, VIIIa, Tenază)
        ax2 = axes[0, 1]
        ax2.plot(t, c['IXa'], 'b-', linewidth=2, label='IXa')
        ax2.plot(t, c['VIIIa'], 'c-', linewidth=2, label='VIIIa')
        ax2.plot(t, c['XIa'], 'm-', linewidth=2, label='XIa')
        ax2.set_title('PROPAGARE (Calea Intrinsecă)', fontweight='bold')
        ax2.set_xlabel('Timp (s)')
        ax2.set_ylabel('Concentrație (nM)')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        # Panel 3: Amplificare (IIa, Va)
        ax3 = axes[1, 0]
        ax3.plot(t, c['IIa'], 'darkred', linewidth=2, label='Trombină (IIa)')
        ax3.plot(t, c['Va'], 'orange', linewidth=2, label='Va')
        ax3.set_title('AMPLIFICARE (Protrombinază)', fontweight='bold')
        ax3.set_xlabel('Timp (s)')
        ax3.set_ylabel('Concentrație (nM)')
        ax3.legend()
        ax3.grid(True, alpha=0.3)

        # Panel 4: Fibrină și Cheag
        ax4 = axes[1, 1]
        ax4.plot(t, c['Fibrin'], 'brown', linewidth=2, label='Fibrină')
        ax4.plot(t, c['XIIIa'] * 100, 'gray', linewidth=2, label='XIIIa (×100)')
        ax4_twin = ax4.twinx()
        ax4_twin.plot(t, c['Fbg'], 'tan', linewidth=2, linestyle='--', label='Fibrinogen')
        ax4.set_title('FORMAREA CHEAGULUI', fontweight='bold')
        ax4.set_xlabel('Timp (s)')
        ax4.set_ylabel('Fibrină, XIIIa (nM)')
        ax4_twin.set_ylabel('Fibrinogen (nM)')
        ax4.legend(loc='upper left')
        ax4_twin.legend(loc='upper right')
        ax4.grid(True, alpha=0.3)

        plt.suptitle(
            f'Cascada Coagulării - Scenariu: {result.scenario.upper()}',
            fontsize=14,
            fontweight='bold'
        )
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"Grafic salvat: {save_path}")

        # plt.show()  # Disabled for non-interactive mode

    def export_json(
        self,
        result: SimulationResult,
        filepath: str,
        factors: Optional[List[str]] = None,
        time_step: int = 10
    ) -> None:
        """
        Exportă rezultatele în format JSON pentru integrare cu UI React.

        Args:
            result: Rezultatul simulării
            filepath: Calea fișierului JSON
            factors: Lista de factori de exportat (default: toți)
            time_step: Exportă la fiecare N puncte (pentru reducerea dimensiunii)
        """
        if factors is None:
            factors = ['IIa', 'Xa', 'IXa', 'VIIIa', 'Va', 'Fibrin', 'TF_VIIa']

        data = {
            'scenario': result.scenario,
            'parameters': {k: float(v) if isinstance(v, (int, float, np.number)) else v
                          for k, v in result.parameters.items()},
            'time': result.time[::time_step].tolist(),
            'factors': {}
        }

        for factor in factors:
            if factor in result.concentrations:
                data['factors'][factor] = result.concentrations[factor][::time_step].tolist()

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Date exportate în: {filepath}")


def main():
    """Funcția principală - rulează simulări pentru toate scenariile."""
    print("=" * 60)
    print("  SIMULATOR CASCADA COAGULĂRII")
    print("  Model ODE cu rate constants din literatura medicală")
    print("=" * 60)
    print()

    sim = CoagulationSimulator()

    # Grupuri de scenarii pentru comparații
    scenario_groups = {
        'anticoagulants': {
            'title': 'Anticoagulante - Comparație',
            'scenarios': ['normal', 'warfarin', 'heparin_ufh', 'heparin_lmwh'],
        },
        'doacs': {
            'title': 'DOAC (Anticoagulante Orale Directe)',
            'scenarios': ['normal', 'rivaroxaban', 'dabigatran', 'apixaban'],
        },
        'bleeding_disorders': {
            'title': 'Tulburări Hemoragice',
            'scenarios': ['normal', 'hemophilia_a', 'hemophilia_b', 'vwd_type1'],
        },
        'treatments': {
            'title': 'Tratamente / Reversare',
            'scenarios': ['normal', 'fviii_concentrate', 'fix_concentrate', 'pcc', 'ffp'],
        },
        'pathology': {
            'title': 'Patologii',
            'scenarios': ['normal', 'dic', 'liver_disease'],
        },
    }

    all_results = {}

    # Rulează toate simulările
    print("=" * 60)
    print("  RULARE SIMULĂRI")
    print("=" * 60)

    all_scenarios = set()
    for group in scenario_groups.values():
        all_scenarios.update(group['scenarios'])

    for scenario in sorted(all_scenarios):
        print(f"\n  [{scenario.upper()}]")
        result = sim.simulate(scenario=scenario, t_end=600, tf_concentration=25.0)
        all_results[scenario] = result

        # Calculează metrici
        iia = result.concentrations['IIa']
        peak_iia = np.max(iia)
        time_to_peak = result.time[np.argmax(iia)]
        lag_time = result.time[np.argmax(iia > 10)] if np.any(iia > 10) else float('inf')

        print(f"    Peak IIa:      {peak_iia:>8.1f} nM")
        print(f"    Lag time:      {lag_time:>8.1f} s")
        print(f"    Time to peak:  {time_to_peak:>8.1f} s")

        # Info suplimentar
        fibrin_final = result.concentrations['Fibrin'][-1]
        xa_peak = np.max(result.concentrations['Xa'])
        print(f"    Peak Xa:       {xa_peak:>8.1f} nM")
        print(f"    Fibrin final:  {fibrin_final:>8.1f} nM")

    # Generează grafice pe grupuri
    print("\n" + "=" * 60)
    print("  GENERARE GRAFICE")
    print("=" * 60)

    for group_name, group_data in scenario_groups.items():
        results_list = [all_results[s] for s in group_data['scenarios']]
        filename = f"comparison_{group_name}.png"
        print(f"\n  Generare: {filename}")
        sim.plot_thrombin_generation(
            results_list,
            title=group_data['title'],
            save_path=filename
        )

    # Overview pentru scenariul normal
    print("\n  Generare: cascade_overview_normal.png")
    sim.plot_cascade_overview(
        all_results['normal'],
        save_path="cascade_overview_normal.png"
    )

    # Export JSON pentru UI
    print("\n" + "=" * 60)
    print("  EXPORT JSON")
    print("=" * 60)
    for scenario, result in all_results.items():
        filepath = f"simulation_{scenario}.json"
        sim.export_json(result, filepath)

    # Tabel sumar
    print("\n" + "=" * 60)
    print("  SUMAR REZULTATE")
    print("=" * 60)
    print(f"\n  {'Scenariu':<20} {'Peak IIa (nM)':<15} {'Lag (s)':<10} {'Fibrin (nM)':<12}")
    print("  " + "-" * 57)

    for scenario in sorted(all_results.keys()):
        result = all_results[scenario]
        iia = result.concentrations['IIa']
        peak = np.max(iia)
        lag = result.time[np.argmax(iia > 10)] if np.any(iia > 10) else float('inf')
        fibrin = result.concentrations['Fibrin'][-1]
        lag_str = f"{lag:.1f}" if lag < float('inf') else "∞"
        print(f"  {scenario:<20} {peak:<15.1f} {lag_str:<10} {fibrin:<12.1f}")

    print("\n" + "=" * 60)
    print("  SIMULARE COMPLETĂ!")
    print("=" * 60)


if __name__ == "__main__":
    main()
