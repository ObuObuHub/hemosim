# HemoSim - Ghid Interactiv al Cascadei de Coagulare

## Despre HemoSim

HemoSim este un simulator vizual interactiv al cascadei de coagulare, destinat educației medicale. Aplicația permite:
- Introducerea valorilor de laborator și vizualizarea impactului asupra cascadei
- Selectarea scenariilor clinice predefinite
- Identificarea pattern-urilor de coagulare și diagnosticul diferențial

---

## Codul Culorilor în Cascadă

| Culoare | Cale | Factori | Test Lab |
|---------|------|---------|----------|
| 🔵 **Albastru** | Intrinsecă | XII, XI, IX, VIII | aPTT |
| 🟢 **Verde** | Extrinsecă | TF, VII | PT/INR |
| 🟣 **Violet** | Comună | X, V, II, Fbg, XIII | PT + aPTT |
| 🔴 **Roșu** | Hemostază Primară | vWF, PLT | Timp sângerare |
| 🔷 **Cyan** | Anticoagulanți | AT, PC, PS, TFPI, TM | - |
| 🟡 **Galben** | Fibrinoliză | tPA, PLG, Plasmin, PAI-1 | D-dimeri |

### Indicatori Vizuali
- **Cerc plin colorat**: Factor normal, activ
- **Cerc cu border întrerupt**: Factor afectat/deficitar
- **Săgeată întreruptă**: Flux redus între factori
- **Badge verde "K"**: Factor vitamină K dependent

---

## Structura Cascadei în HemoSim

```
CALEA INTRINSECĂ (albastru)          CALEA EXTRINSECĂ (verde)
        │                                    │
      [XII]                                 [TF]
        │                                    │
        ▼                                    ▼
      [XI]                                 [VII]
        │                                  ╱    ╲
        ▼                                ╱        ╲
      [IX] ◄─────────────────────────────┘          │
        │                                           │
[vWF]──►[VIII]                                     │
        │                                           │
        └────────────►[X]◄──────────────────────────┘
                       │
                       ▼
                      [V]
                       │
                       ▼
                      [II] ──────► [XIII]
                       │
                       ▼
                     [Fbg]
```

### Relații Importante Vizualizate:
1. **Cross-talk TF-VIIa → F9**: Săgeata verde de la VII spre IX
2. **Tenase Intrinsec**: F9 și F8 converg pe F10
3. **Trombina activează F13**: Săgeată de la II spre XIII
4. **vWF transportă F8**: Săgeată de la vWF spre VIII

---

## Scenarii Disponibile

### Tratamente Anticoagulante

| Scenariu | Factori Afectați | Pattern Lab | Ce vezi în cascadă |
|----------|------------------|-------------|-------------------|
| **Normal** | Niciunul | Toate normale | Toți factorii activi |
| **Warfarină/AVK** | II, VII, IX, X | ↑PT, ↑INR | Factorii K-dep cu border întrerupt |
| **Heparină UFH** | II, X | ↑aPTT, ↑TT | F2 și F10 afectați |
| **LMWH** | X | aPTT ușor ↑ | F10 afectat subtil |
| **DOAC** | X (sau II) | ↑PT variabil | F10 afectat |

### Patologii de Coagulare

| Scenariu | Factori Afectați | Pattern Lab | Diagnostic |
|----------|------------------|-------------|------------|
| **Hemofilie A** | VIII | ↑aPTT izolat | Deficit X-linked, cel mai frecvent |
| **Hemofilie B** | IX | ↑aPTT izolat | Christmas disease |
| **Boala von Willebrand** | vWF, VIII | ↑aPTT, ↑BT | vWF transportă/stabilizează VIII |
| **Purpura Trombocitopenică** | PLT | ↑BT, PLT↓ | Trombocitopenie izolată |
| **Deficit Vitamina K** | II, VII, IX, X | ↑PT, ↑aPTT | Toți factorii K-dependenți |
| **Insuficiență Hepatică** | II, V, VII, IX, X, Fbg | ↑PT, ↑aPTT | Ficatul sintetizează majoritatea |
| **Sindrom Antifosfolipidic** | - | ↑aPTT | TROMBOFILIE! Paradox lab |
| **Trombofilie** | - | ↑D-dimeri | Screening, fără deficit |

### Coagulare Intravasculară Diseminată (CID)

| Fază | Factori Afectați | Pattern Lab |
|------|------------------|-------------|
| **Activare** | PLT | PLT↓, D-dim↑ |
| **Consum** | II, V, VIII, X, Fbg, PLT | PT↑, aPTT↑, Fbg↓, PLT↓↓ |
| **Hemoragică** | Toți | PT↑↑, aPTT↑↑, Fbg↓↓, PLT↓↓↓ |

---

## Interpretarea Pattern-urilor

### aPTT Izolat Prelungit (PT normal)
**Cale afectată**: Intrinsecă (albastru)

| Mixing Test | Interpretare | Diagnostice Posibile |
|-------------|--------------|---------------------|
| Corectează | Deficit de factor | Hemofilie A, B, C, vWD |
| NU corectează | Inhibitor prezent | APS (lupus anticoagulant), Hemofilie dobândită |
| Neefectuat | Diferențial complet | Toate de mai sus |

**În HemoSim**: Factorii VIII, IX, XI apar cu border întrerupt

### PT Izolat Prelungit (aPTT normal)
**Cale afectată**: Extrinsecă (verde)

| Cauză | Factori | Note |
|-------|---------|------|
| Deficit F.VII | VII | Singurul factor extrinsec pur |
| Warfarină precoce | VII | F.VII are T1/2 cel mai scurt |
| Boală hepatică incipientă | VII | Primul afectat |

**În HemoSim**: Factorul VII apare cu border întrerupt

### PT și aPTT Prelungite
**Cale afectată**: Comună (violet)

| Pattern suplimentar | Diagnostic probabil |
|--------------------|---------------------|
| + Fbg↓ + PLT↓ + D-dim↑ | CID (calculează scor ISTH) |
| + Fbg↓ izolat | Hipo/Afibrinogenemie |
| Fbg normal | Insuficiență hepatică sau Deficit Vit.K |

**În HemoSim**: Factorii X, V, II, Fbg apar cu border întrerupt

### Timp Sângerare Prelungit (PT/aPTT normale)
**Cale afectată**: Hemostază primară (roșu)

| PLT | Diagnostic |
|-----|------------|
| Scăzute | Trombocitopenie |
| Normale | Disfuncție plachetară, vWD tip 1, antiagregante |

**În HemoSim**: PLT și/sau vWF apar cu border întrerupt

---

## Factori Vitamină K Dependenți

Vizualizați în cascadă cu badge-ul verde **"K"**:

| Factor | Localizare în cascadă | Notă clinică |
|--------|----------------------|--------------|
| **VII** | Calea extrinsecă | T1/2 = 6h (cel mai scurt) |
| **IX** | Calea intrinsecă | Deficit = Hemofilie B |
| **X** | Calea comună | Punct de convergență |
| **II** | Calea comună | Protrombină → Trombină |
| **PC** | Anticoagulanți | Inactivează Va, VIIIa |
| **PS** | Anticoagulanți | Cofactor pentru PC |

**Warfarina** blochează toți acești factori → veți vedea multiple noduri afectate.

---

## Inhibitori și Fibrinoliză

### TFPI (Tissue Factor Pathway Inhibitor)
- **Funcție**: Inhibă complexul TF-VIIa și Factor Xa
- **Produs de**: Endoteliu vascular
- **Mecanism**: Leagă Xa, apoi complexul TFPI-Xa inhibă TF-VIIa
- **Relevanță clinică**: Reglator precoce al căii extrinseci

### Trombomodulina (TM)
- **Funcție**: Receptor endotelial care leagă trombina
- **Mecanism**: Complexul Trombină-TM activează Proteina C
- **Efect**: Transformă trombina din procoagulant în anticoagulant
- **Relevanță clinică**: Deficitul → trombofilie; Trombomodulina solubilă ↑ în sepsis

### Sistemul Fibrinolitic

| Component | Funcție | Produs de |
|-----------|---------|-----------|
| **t-PA** | Activator al plasminogenului | Endoteliu |
| **Plasminogen** | Zimogen (precursor inactiv) | Ficat |
| **Plasmina** | Degradează fibrina → D-dimeri | Din plasminogen |
| **PAI-1** | Inhibă t-PA | Endoteliu, trombocite |

### Cascade Fibrinolitică
```
[t-PA] ──────► [Plasminogen] ──────► [Plasmina]
   ▲                                      │
   │                                      ▼
[PAI-1] ⊣                            [Fibrină] → D-dimeri
```

### Relevanță Clinică Fibrinoliză
- **D-dimeri ↑**: CID, TVP, EP, COVID sever
- **t-PA terapeutic**: Stroke ischemic, EP masivă
- **Acid tranexamic**: Inhibă plasmina (antifibrinolitic)

---

## Testul de Mixing (Rosner Index)

Când aPTT este prelungit, testul de mixing diferențiază:

### Deficit de Factor
- Plasma pacientului + Plasma normală → **aPTT se corectează**
- Cauze: Hemofilii, vWD
- **Index Rosner < 11%**

### Inhibitor (Anticorpi)
- Plasma pacientului + Plasma normală → **aPTT NU se corectează**
- Cauze: Lupus anticoagulant (APS), Hemofilie dobândită
- **Index Rosner > 15%**

**Formulă**: `Index Rosner = ((aPTT mix - aPTT normal) / aPTT pacient) × 100`

---

## Scorul ISTH pentru CID

Calculat automat când pattern-ul sugerează CID:

| Parametru | 0 puncte | 1 punct | 2 puncte | 3 puncte |
|-----------|----------|---------|----------|----------|
| **Trombocite** | >100 | 50-100 | <50 | - |
| **D-dimeri** | Normal | Moderat ↑ | - | Sever ↑ |
| **PT prelungit** | <3s | 3-6s | >6s | - |
| **Fibrinogen** | >100 | ≤100 | - | - |

| Scor Total | Interpretare |
|------------|--------------|
| ≥5 | **CID MANIFEST** - tratează cauza! |
| <5 | Posibil CID non-manifest - repetă la 24-48h |

---

## Scorul 4T pentru HIT

Apare automat când:
- Heparină sau LMWH activă
- Trombocite <150.000

| Criteriu | 0 | 1 | 2 |
|----------|---|---|---|
| **Trombocitopenie** | <30% sau nadir <10 | 30-50% sau nadir 10-19 | >50% și nadir ≥20 |
| **Timing** | ≤4 zile fără expunere | >10 zile sau neclar | Ziua 5-10 |
| **Tromboză** | Absent | Suspectată | Confirmată/Necroză |
| **Alte cauze** | Evidente | Posibile | Nicio altă cauză |

| Scor | Probabilitate | Interpretare |
|------|---------------|--------------|
| 0-3 | Scăzută (<5%) | Trombocitopenie indusă de heparină puțin probabilă |
| 4-5 | Intermediară (~14%) | Testează anticorpi anti-PF4/heparină |
| 6-8 | **Ridicată (~64%)** | **Consultați urgent specialistul** |

---

## Ghid Rapid de Utilizare

### 1. Introducere Valori Lab
- Modifică valorile în panoul stâng
- Valorile anormale se colorează (galben/roșu)
- Cascada se actualizează în timp real

### 2. Selectare Scenariu
- Tab "Scenarii" → alege patologia
- Valorile se setează automat
- Factorii afectați se evidențiază

### 3. Interpretare
- Panoul drept arată diagnosticul diferențial
- Probabilități: Mare (roșu) / Posibil (albastru)
- Recomandări pentru teste suplimentare

### 4. Mixing Test
- Apare când aPTT >40s
- Selectează rezultatul pentru a rafina diagnosticul

---

## Referințe Medicale

- Harrison's Principles of Internal Medicine
- UpToDate: Approach to the bleeding patient
- StatPearls: Coagulation Cascade
- ISTH Guidelines for DIC
- Warkentin TE: 4T Score for HIT

---

*HemoSim © Dr. Chiper - Calculator și simulator hemostază pentru învățământ medical*
