# Modelul Celular al Coagulării - HemoSim

## Introducere

Această documentație descrie reprezentarea vizuală a **Modelului Celular al Coagulării** propus de **Hoffman și Monroe** (2001), implementată în aplicația HemoSim. Modelul înlocuiește viziunea clasică a "cascadei" cu o abordare bazată pe suprafețe celulare și faze distincte.

---

## Principii Fundamentale

### Concepte Cheie Hoffman-Monroe

1. **Coagularea are loc pe suprafețe celulare**, nu în plasmă
2. **Trei tipuri de celule** sunt esențiale:
   - Celule purtătoare de Factor Tisular (TF) - inițiază procesul
   - Trombocite - amplifică și propagă
   - Eritrocite - furnizează fosfolipide
3. **Trei faze distincte**: Inițiere → Amplificare → Propagare (+ Stabilizare)

### Sistem de Reprezentare Vizuală

| Element | Reprezentare | Culoare |
|---------|--------------|---------|
| **Zimogeni** (forme inactive) | Oval simplu | Variabilă după factor |
| **Enzime active** | Cerc cu slot activ | Variabilă după factor |
| **Cofactori** | Dreptunghi cu colțuri rotunjite | Variabilă |
| **Complexe enzimatice** | Grupare de tokeni | - |
| **Membrane celulare** | Linie cu fosfolipide | Gradient portocaliu |

---

## Faza 1: INIȚIERE

### Locație
Pe suprafața celulelor purtătoare de **Factor Tisular (TF)** - de obicei fibroblaste subendoteliale sau monocite activate.

### Evenimentele Reprezentate

#### 1.1 Expunerea Factor Tisular
- **Trigger**: Leziune vasculară expune TF
- **Vizual**: Proteina TF apare pe membrană (structură cu domeniu extracelular)
- **Culoare**: Verde (#22C55E)

#### 1.2 Formarea Complexului TF-FVIIa
- **Mecanism**: TF leagă FVII circulant și îl activează → FVIIa
- **Vizual**:
  - FVII (oval galben) se apropie de TF
  - Transformare în FVIIa (cerc cu slot)
  - Complex TF-FVIIa format pe membrană
- **Culori**:
  - FVII/FVIIa: Galben (#EAB308)
  - TF: Verde (#22C55E)

#### 1.3 Activarea FX → FXa
- **Mecanism**: Complexul TF-FVIIa clivează FX
- **Vizual**:
  - FX (oval cyan) se apropie de complex
  - Animație de clivare (flash)
  - FXa (cerc cyan cu slot) rezultă
- **Culoare FX/FXa**: Cyan (#06B6D4)

#### 1.4 Generarea Inițială de Trombină
- **Mecanism**: FXa activează cantități mici de protrombină (FII) → Trombină (FIIa)
- **Vizual**:
  - FII (oval roșu) → FIIa (cerc roșu cu slot)
  - Cantitate mică (~1-2% din total)
- **Culoare FII/FIIa**: Roșu (#DC2626)

### Output Faza 1
- Cantități **trace** de FIIa (insuficiente pentru cheag)
- Proces limitat de **TFPI** (inhibitorul căii TF)

---

## Faza 2: AMPLIFICARE

### Locație
Pe suprafața **trombocitelor** activate.

### Evenimentele Reprezentate

#### 2.1 Activarea Trombocitelor
- **Mecanism**: Trombina (din faza 1) + Colagen activează trombocitele
- **Vizual**:
  - Trombocit în repaus → Trombocit activat
  - Receptori PAR (Protease-Activated Receptors) clivați de FIIa
  - Schimbare de formă (spreading)
- **Interacțiune**: Click pe receptor PAR

#### 2.2 Activarea Cofactorilor

##### FV → FVa
- **Mecanism**: FIIa clivează FV
- **Vizual**:
  - FV (dreptunghi albastru pal) → FVa (dreptunghi albastru activ)
- **Culoare**: Albastru (#3B82F6)
- **Rol**: Cofactor pentru protrombinază

##### FVIII → FVIIIa
- **Mecanism**: FIIa clivează FVIII (eliberat de vWF)
- **Vizual**:
  - FVIII (dreptunghi mov pal) → FVIIIa (dreptunghi mov activ)
- **Culoare**: Mov (#8B5CF6)
- **Rol**: Cofactor pentru tenază

##### FXI → FXIa
- **Mecanism**: FIIa activează FXI pe suprafața trombocitară
- **Vizual**:
  - FXI (oval roz) → FXIa (cerc roz cu slot)
- **Culoare**: Roz (#EC4899)
- **Rol**: Amplificare suplimentară prin activarea FIX

#### 2.3 Activarea FIX → FIXa
- **Mecanism**: FXIa clivează FIX
- **Vizual**:
  - FIX (oval portocaliu) → FIXa (cerc portocaliu cu slot)
- **Culoare**: Portocaliu (#F97316)

### Output Faza 2
- Trombocite activate cu:
  - Cofactori activi (FVa, FVIIIa) pe membrană
  - FIXa și FXa disponibile
- Sistem pregătit pentru **explozie de trombină**

---

## Faza 3: PROPAGARE

### Locație
Pe suprafața **trombocitelor activate** (fosfolipide anionice expuse).

### Complexele Enzimatice

#### 3.1 Complexul TENAZĂ Intrinsec
- **Componente**: FIXa + FVIIIa + Ca²⁺ + Fosfolipide
- **Vizual**:
  - FIXa (cerc portocaliu) + FVIIIa (dreptunghi mov)
  - Ancorat pe membrană prin domeniul Gla
  - Ioni Ca²⁺ reprezentați ca puncte turcoaz
- **Substrat**: FX
- **Produs**: FXa (eficiență ×50-100 vs FXa singur)
- **Interacțiune**: Click pe FX pentru activare

#### 3.2 Complexul PROTROMBINAZĂ
- **Componente**: FXa + FVa + Ca²⁺ + Fosfolipide
- **Vizual**:
  - FXa (cerc cyan) + FVa (dreptunghi albastru)
  - Ancorat pe membrană
  - Ioni Ca²⁺
- **Substrat**: FII (Protrombină)
- **Produs**: FIIa (Trombină)
- **Eficiență**: ×300,000 vs FXa singur
- **Interacțiune**: Click pe FII pentru activare

#### 3.3 Explozia de Trombină (Thrombin Burst)
- **Mecanism**: Protrombinaza generează cantități masive de FIIa
- **Vizual**:
  - Animație radială de la complex
  - Multiple molecule FIIa emanând
  - Label: "~350 nM TROMBINĂ" / "×300,000 amplificare"
- **Concentrație**: ~350 nM (suficientă pentru cheag)

### Output Faza 3
- **Explozie de trombină** (~350 nM)
- Cantitate suficientă pentru:
  - Clivarea fibrinogenului
  - Activarea FXIII
  - Feedback pozitiv continuu

---

## Faza 4: STABILIZARE (Formarea Cheagului)

### Locație
În plasmă, la locul leziunii.

### Diagrama Interactivă Centrală

Reprezentare vizuală a rolului dual al trombinei:

```
                    FIIa
                  (Trombină)
                 /          \
                ↓            ↓
              FI            FXIII
         (Fibrinogen)    (Factor XIII)
                |            |
                ↓            ↓
            Fibrină       FXIIIa
                 \          /
                  \        /
                   ↘      ↙
              [REȚEA FIBRINĂ]
                     ↓
               cross-link
                     ↓
             Cheag stabilizat
```

### Evenimentele Reprezentate

#### 4.1 Clivarea Fibrinogenului
- **Mecanism**: FIIa clivează fibrinopeptidele A și B din fibrinogen
- **Vizual**:
  - FI (oval galben) → Click → devine transparent
  - Fibrină (oval verde) devine vizibilă
  - Rețeaua centrală de fibrină apare (fibre roșii-maronii)
- **Culori**:
  - Fibrinogen (FI): Galben (#EAB308)
  - Fibrină: Verde (#22C55E)
  - Rețea fibrină: Roșu închis (#B91C1C)

#### 4.2 Activarea FXIII
- **Mecanism**: FIIa activează FXIII (transglutaminază)
- **Vizual**:
  - FXIII (oval verde pal) → Click → devine transparent
  - FXIIIa (cerc verde închis cu slot) devine activ
- **Culori**:
  - FXIII: Verde (#22C55E)
  - FXIIIa: Verde închis (#059669)

#### 4.3 Cross-linking Fibrină
- **Mecanism**: FXIIIa creează legături covalente între monomerii de fibrină
- **Vizual**:
  - Săgeată curbată punctată de la FXIIIa spre Fibrină
  - Label "cross-link"
  - Rețeaua centrală:
    - Se întunecă (roșu-maroniu închis #7F1D1D)
    - Devine mai groasă
    - Apar noduri de cross-linking (cercuri mici)
    - Animația de undă se oprește (cheag solid)

#### 4.4 Cheag Stabilizat
- **Vizual**:
  - Rețea fibrină complet cross-linkată
  - Label în chenar: "Cheag stabilizat"
- **Proprietăți cheag**:
  - Rezistent la fibrinoliză
  - Stabil mecanic
  - Ancorat de trombocite

### Rețeaua Centrală de Fibrină

| Stare | Aspect | Culoare | Animație |
|-------|--------|---------|----------|
| Absență | Invizibil | - | - |
| După clivare FI | Fibre subțiri | Roșu (#B91C1C) | Undă subtilă |
| După cross-link | Fibre groase + noduri | Maroniu (#7F1D1D) | Static (solid) |

---

## Sistemul de Culori

### Factori de Coagulare

| Factor | Culoare | Hex Code |
|--------|---------|----------|
| FII/FIIa (Trombină) | Roșu | #DC2626 |
| FVII/FVIIa | Galben | #EAB308 |
| FVIII/FVIIIa | Mov | #8B5CF6 |
| FIX/FIXa | Portocaliu | #F97316 |
| FX/FXa | Cyan | #06B6D4 |
| FXI/FXIa | Roz | #EC4899 |
| FXIII/FXIIIa | Verde | #22C55E / #059669 |
| FV/FVa | Albastru | #3B82F6 |
| Fibrinogen (FI) | Galben | #EAB308 |
| Fibrină | Verde | #22C55E |

### Elemente Structurale

| Element | Culoare | Hex Code |
|---------|---------|----------|
| Factor Tisular (TF) | Verde | #22C55E |
| Membrane | Gradient portocaliu | #FDBA74 → #FB923C |
| Ca²⁺ | Turcoaz | #22D3EE |
| Domeniu Gla | Verde deschis | #86EFAC |
| Rețea fibrină (loosă) | Roșu închis | #B91C1C |
| Rețea fibrină (cross-linked) | Maroniu | #7F1D1D |

---

## Interacțiuni Utilizator

### Mod Manual
Utilizatorul controlează fiecare pas prin click:

1. **Faza Inițiere**: Click pe factori pentru activare secvențială
2. **Faza Amplificare**: Click pe PAR, apoi cofactori
3. **Faza Propagare**:
   - Click pe FX (la tenază) → FXa
   - Click pe FII (la protrombinază) → Thrombin Burst
4. **Faza Stabilizare**:
   - Click pe FI → Fibrină + rețea apare
   - Click pe FXIII → FXIIIa → cross-linking

### Mod Auto
Toate fazele progresează automat cu timing-uri predefinite.

---

## Referințe

1. Hoffman M, Monroe DM. **A cell-based model of hemostasis.** Thromb Haemost. 2001;85(6):958-65.
2. Monroe DM, Hoffman M. **What does it take to make the perfect clot?** Arterioscler Thromb Vasc Biol. 2006;26(1):41-8.
3. Smith SA. **The cell-based model of coagulation.** J Vet Emerg Crit Care. 2009;19(1):3-10.

---

## Versiune

- **Document**: v1.0
- **Data**: 2026-02-01
- **Aplicație**: HemoSim - Modelul Celular al Coagulării
