# HemoSim - Conținut Textual pentru Fact-Checking

> **Document generat automat** din codul sursă pentru verificare și modificări rapide.
> Fișiere sursă: `engine/interpreter.ts`, `engine/factors.ts`, `engine/coagulation.ts`

---

## ⚕️ Atenționare

**HemoSim** este un instrument de **STUDIU** și **INTERPRETARE** destinat studenților și medicilor.

- Oferă diagnostice diferențiale și sugestii de investigații suplimentare
- **NU** oferă recomandări terapeutice
- Decizia clinică aparține **EXCLUSIV** medicului curant
- Corelația clinico-biologică este **OBLIGATORIE**

> **ACEST INSTRUMENT NU PUNE DIAGNOSTICE ȘI NU ÎNLOCUIEȘTE JUDECATA CLINICĂ.**

*© Dr. Chiper-Leferman Andrei*

---

## Cuprins

1. [Factori de Coagulare (Cascadă)](#1-factori-de-coagulare-cascadă)
2. [Diagnostice Diferențiale](#2-diagnostice-diferențiale)
3. [Recomandări](#3-recomandări)
4. [Avertismente (Warnings)](#4-avertismente-warnings)
5. [Scoruri Clinice](#5-scoruri-clinice)
6. [Intervale de Referință](#6-intervale-de-referință)
7. [Scenarii Educaționale](#7-scenarii-educaționale)

---

## 1. Factori de Coagulare (Cascadă)

### Calea Intrinsecă

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **F12** | Factor XII (Hageman) | Zimogen. Activat de suprafețe încărcate negativ (sticlă, caolin, polifosfați). Rol in vivo controversat. |
| **F12a** | Factor XIIa | Formă activată. Deficitul NU cauzează sângerare! Activează F11. |
| **F11** | Factor XI (PTA) | Zimogen. Hemofilia C (Rosenthal) - frecvent la evrei Ashkenazi. |
| **F11a** | Factor XIa | Formă activată. Activat de XIIa sau Trombină (feedback). Activează IX. |
| **F9** | Factor IX (Christmas) | Zimogen vitamină K dependent. Hemofilia B. Activat de XIa și VIIa (Josso). |
| **F9a** | Factor IXa | Enzimă în complexul Tenază. Derivă din IX (activat de XIa și VIIa). |
| **F8** | Factor VIII (Antihemophilic) | **Procofactor**. Transportat de vWF. Activat de IIa (feedback). Hemofilia A. |
| **F8a** | Factor VIIIa | Cofactor în Tenază. Derivă din VIII (activat de IIa). Amplifică IXa de ~200.000x. |

### Calea Extrinsecă

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **TF** | Factor Tisular (III) | Cofactor/receptor pentru VIIa. Expus la leziuni vasculare. Complex inițiator. |
| **F7** | Factor VII (Stable Factor) | Zimogen vitamină K dependent. T1/2 cel mai scurt (6h) - primul afectat în boala hepatică. |
| **F7a** | Factor VIIa | Enzimă în complexul TF-VIIa. Activează X și IX (Josso loop - extrinsec → intrinsec). |

### Calea Comună

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **F10** | Factor X (Stuart-Prower) | Zimogen vitamină K dependent. Activat de Tenază [IXa+VIIIa] și TF-VIIa. Punct de convergență. |
| **F10a** | Factor Xa | Enzimă în Protrombinază. Derivă din X. Inhibat de DOAC anti-Xa (relevanță: interpretare PT/anti-Xa). |
| **F5** | Factor V (Proaccelerin) | **Procofactor**. Factor V Leiden - rezistență la PC activată. |
| **F5a** | Factor Va | Cofactor în Protrombinază. Derivă din V (activat de IIa). Amplifică Xa ~10.000x. |
| **F2** | Protrombină (Factor II) | Zimogen vitamină K dependent. Mutația G20210A = trombofilie. |
| **IIa** | Trombină (Factor IIa) | Formă activată. Inhibată de dabigatran (relevanță: TT prelungit). Rol dual: procoagulant + activează PC. |
| **FBG** | Fibrinogen (Factor I) | Precursor proteic. Reactant de fază acută. Produs de ficat. |
| **FBN** | Fibrină (Factor Ia) | Formă activată. Monomeri care polimerizează. Degradarea = D-dimeri. |
| **F13** | Factor XIII | Zimogen (transglutaminază). Stabilizează cheagul prin cross-link fibrină. |
| **F13a** | Factor XIIIa | Formă activată. Cross-linkează fibrina → cheag stabil, rezistent la fibrinoliză. |
| **FIBRIN_NET** | Cheagul stabilizat | Cheag stabil. Cross-linkuri covalente (XIIIa). Rezistent la fibrinoliză. |

### Hemostază Primară

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **vWF** | Factorul von Willebrand | Carrier pentru FVIII. Clivat de ADAMTS13 - deficit ADAMTS13 → **!!PURPURĂ TROMBOTICĂ TROMBOCITOPENICĂ!!** (multimeri ultra-largi). |
| **PLT** | Trombocite | Click pentru detalii HEMOSTAZA PRIMARĂ: Adeziune, Activare, Agregare. **Notă: BT (timp sângerare) = test depășit; ISTH/BSH recomandă PFA-100.** |

### Anticoagulanți Naturali

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **TFPI** | Tissue Factor Pathway Inhibitor | Leagă Xa, apoi complexul TFPI-Xa inhibă TF-VIIa. Reglator precoce. |
| **AT** | Antitrombina III | Potențată de heparină (relevanță: interpretare aPTT sub heparină). Deficitul = trombofilie. |
| **TM** | Trombomodulină | Receptor endotelial. Complexul IIa-TM activează PC → efect anticoagulant. |
| **PC** | Proteina C | Zimogen vitamină K dependent. Activată de complexul IIa-TM. |
| **APC** | Proteina C Activată | Formă activată. Inactivează Va și VIIIa. Necesită PS ca cofactor. |
| **PS** | Proteina S | Cofactor pentru APC. NU este enzimă - amplifică activitatea APC. |

### Fibrinoliză

| ID | Nume | Notă Clinică |
|----|------|--------------|
| **tPA** | t-PA (Activator Plasminogen) | Eliberat de endoteliu. Activează plasminogenul legat de fibrină. |
| **PLG** | Plasminogen | Zimogen produs de ficat. Se leagă de fibrină și este activat de tPA. |
| **PLASMIN** | Plasmină | Formă activată. Degradează fibrina → D-dimeri (marker fibrinoliză). |
| **PAI1** | PAI-1 | Inhibitor al tPA. ↑ în obezitate, DZ2, sepsis → risc trombotic. |

---

## 2. Diagnostice Diferențiale

### Pattern: aPTT Izolat Prelungit

#### Cu Heparină Activă
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| heparin_effect | Efect Heparină | `high` | aPTT prelungit consistent cu terapia heparinică. |

#### Mixing Test CORECTEAZĂ + BT Prelungit
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| vwd | Boala von Willebrand | `high` | Deficit vWF cu afectare secundară F.VIII. BT prelungit + aPTT↑ = combinație sugestivă. |
| hemophilia_a | Hemofilie A | `moderate` | Deficit Factor VIII. X-linked recesiv. |

**Recomandare adăugată:** NOTĂ vWD: aPTT prelungit apare DOAR când FVIII <30-40%. Multe cazuri de vWD au aPTT NORMAL!

#### Mixing Test CORECTEAZĂ + BT Normal
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| hemophilia_a | Hemofilie A | `high` | Deficit Factor VIII. X-linked recesiv. Cea mai frecventă cauză. |
| hemophilia_b | Hemofilie B | `moderate` | Deficit Factor IX (Christmas disease). Mai rar decât Hemofilia A. |
| hemophilia_c | Hemofilie C (Deficit F.XI) | `low` | Deficit Factor XI. Sângerare variabilă. |
| vwd | Boala von Willebrand | `low` | Posibil tip 2N (afectează doar FVIII, nu BT). |
| f12_deficiency | Deficit Factor XII | `low` | NU cauzează sângerare! Doar prelungire aPTT in vitro. |

#### Mixing Test NU CORECTEAZĂ (Inhibitor)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| lupus_anticoagulant | Sindrom Antifosfolipidic (APS) | `high` | TROMBOFILIE! Paradox: aPTT↑ in vitro dar risc TROMBOTIC in vivo. |
| acquired_hemophilia | Hemofilie Dobândită | `moderate` | Autoanticorpi anti-Factor VIII. Mai frecvent la vârstnici, postpartum, autoimun. |
| specific_inhibitor | Inhibitor Specific de Factor | `low` | Anticorpi împotriva unui factor specific (rar). |

#### Mixing Test Neefectuat
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| hemophilia_a | Hemofilie A | `high` | Deficit Factor VIII. X-linked recesiv. |
| hemophilia_b | Hemofilie B | `moderate` | Deficit Factor IX (Christmas disease). |
| hemophilia_c | Hemofilie C (Deficit F.XI) | `moderate` | Deficit Factor XI. Sângerare variabilă. |
| vwd | Boala von Willebrand | `moderate` | Deficit vWF cu afectare secundară F.VIII. aPTT poate fi ușor prelungit sau normal. |
| f12_deficiency | Deficit Factor XII | `low` | NU cauzează sângerare! Prelungește aPTT in vitro dar fără risc hemoragic clinic. |
| lupus_anticoagulant | Sindrom Antifosfolipidic (APS) | `low` | TROMBOFILIE! Paradox: aPTT↑ in vitro dar risc TROMBOTIC in vivo. |

---

### Pattern: PT Izolat Prelungit

#### Cu Warfarină Activă
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| warfarin_effect | Efect Warfarină | `high` | PT prelungit consistent cu terapia AVK. |

#### Cu DOAC anti-Xa Activ
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| doac_xa_effect | Efect DOAC (inhibitor Xa) | `high` | Rivaroxaban/Apixaban/Edoxaban inhibă F.Xa. PT-ul nu este un indicator de încredere. |

#### Cu DOAC anti-IIa Activ
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| doac_iia_effect | Efect Dabigatran (inhibitor IIa) | `high` | Dabigatran poate prelungi ușor PT, dar TT este mult mai sensibil. |

#### Fără Medicamente
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| f7_deficiency | Deficit Factor VII | `high` | Singurul deficit care prelungește izolat PT. |
| early_liver | Insuficiență Hepatică Incipientă | `moderate` | F.VII are cel mai scurt T1/2 - primul afectat. |
| early_vitk | Deficit Vit.K Incipient | `moderate` | F.VII primul afectat datorită T1/2 scurt. |

---

### Pattern: PT și aPTT Prelungite

#### Cu Fibrinogen↓ + Trombocite↓ + D-dimeri↑ (Suspiciune CID)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| dic | Coagulare Intravasculară Diseminată (CID) | `high`/`moderate` | SCOR ISTH: X/8 - [interpretare] |

#### Cu Fibrinogen < 50 mg/dL (Afibrinogenemie)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| afibrinogenemia | Afibrinogenemie | `high` | Fibrinogen < 50 mg/dL - deficit sever, posibil congenital (AR). |
| hypofib_congenital | Hipofibrinogenemie Congenitală | `moderate` | Deficit parțial ereditar de fibrinogen. |

#### Cu Fibrinogen 50-100 mg/dL
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| severe_hypofib | Hipofibrinogenemie Severă | `high` | Fibrinogen 50-100 mg/dL - deficit semnificativ clinic. |
| consumption | Coagulopatie de Consum | `moderate` | Consum de fibrinogen în DIC, hemoragie masivă, sau hiperfibrinoliză. |

#### Cu Fibrinogen 100-200 mg/dL
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| moderate_hypofib | Hipofibrinogenemie Moderată | `high` | Fibrinogen 100-200 mg/dL - monitorizare necesară. |
| liver_synthesis | Deficit de Sinteză Hepatică | `moderate` | Ficatul sintetizează fibrinogenul - evaluare funcție hepatică. |

#### Fără Fibrinogen Scăzut
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| liver_failure | Insuficiență Hepatică | `high` | Sinteză deficitară a majorității factorilor. |
| vitk_deficiency | Deficit Vitamina K | `moderate` | Afectează F.II, VII, IX, X + Proteina C/S. |
| common_pathway | Deficit Cale Comună (F.X, V, II) | `moderate` | Deficite rare ale factorilor comuni. |

---

### Pattern: Trombocitopenie / BT Prelungit

#### Clasificare Severitate Trombocitopenie

| Nivel | Trombocite | Risc Clinic |
|-------|------------|-------------|
| **Ușoară** | 100-150.000/µL | De obicei asimptomatică. Investigație etiologică recomandată. |
| **Moderată** | 50-100.000/µL | Risc la proceduri invazive. Monitorizare necesară. |
| **Severă** | 20-50.000/µL | Risc hemoragic la proceduri și traumatisme minore. |
| **Critică** | <20.000/µL | **URGENȚĂ!** Risc hemoragie spontană (SNC, GI)! |

#### Trombocitopenie Severă/Critică (<50.000)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| thrombocytopenia | Trombocitopenie [Severitate] | `high` | [Severitate]. [Descriere risc]. |
| itp | Purpură Trombocitopenică Imună (ITP) | `high` | Distrugere autoimună. Frotiu: trombocite mari, fără schizocite. |
| ttp_hus | TTP / SHU (Microangiopatie) | `moderate` | URGENȚĂ! Pentada: trombocitopenie, anemie hemolitică, febră, afectare renală, neurologică. |
| bone_marrow_failure | Insuficiență Medulară | `moderate` | Producție scăzută: aplazie, infiltrare (leucemie, metastaze), mielodisplazie. |

#### Trombocitopenie Ușoară/Moderată (50-150.000)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| thrombocytopenia | Trombocitopenie [Severitate] | `high` | [Severitate]. [Descriere risc]. |
| drug_induced | Trombocitopenie Indusă Medicamentos | `moderate` | Cauze frecvente: heparină (HIT), chinină, antibiotice, anticonvulsivante. |
| hypersplenism | Hipersplenism / Sechestrare | `moderate` | Splenomegalie (ciroză, hipertensiune portală). Până la 90% din PLT în splină. |
| pseudothrombocytopenia | Pseudotrombocitopenie | `low` | Artefact EDTA - agregare in vitro. PLT real normal! |

#### BT Prelungit + PLT Normal
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| vwd | Boala von Willebrand | `high` | CEA MAI FRECVENTĂ cauză! 1:100 în populație. **IMPORTANT: aPTT este NORMAL în majoritatea cazurilor (tip 1)!** |
| platelet_dysfunction | Disfuncție Plachetară Dobândită | `moderate` | Uremie, ciroză, sindroame mieloproliferative, paraproteinemii. |
| inherited_platelet | Trombocitopatie Ereditară | `low` | Bernard-Soulier, Glanzmann - rare. Istoric familial, debut copilărie. |

**NOTĂ CRITICĂ vWD:** aPTT prelungit apare DOAR când FVIII <30-40%. Majoritatea pacienților cu vWD tip 1 au aPTT NORMAL!

#### Cu Antiagregant Activ
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| antiplatelet_effect | Efect Antiagregant | `high` | Consistent cu medicația antiplachetară (aspirină, clopidogrel). |

---

### Pattern: D-dimeri Crescuți - Diagnostic Diferențial LARG

**⚠️ ATENȚIE: D-dimerii sunt NESPECIFICI! Corelație clinică OBLIGATORIE.**

#### Cauze NON-Trombotice (FRECVENTE!)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| infection_inflammation | Infecție / Inflamație | `high` | **Cauza cea mai frecventă!** Sepsis, pneumonie, COVID-19, boli autoimune, traumatisme. |
| malignancy | Malignitate | `moderate` | Cancerele activează coagularea. Screening dacă D-dimeri persistent elevați fără cauză. |
| postop_trauma | Postoperator / Traumatism | `moderate` | D-dimeri fiziologic crescuți 1-4 săptămâni post-chirurgie sau traumă. |
| pregnancy | Sarcină / Postpartum | `moderate` | D-dimeri cresc fiziologic în sarcină (de 2-4x). Praguri ajustate necesare. |
| liver_disease_ddimer | Boală Hepatică | `low` | Clearance redus al D-dimerilor + coagulopatie hepatică. |
| age_related | Vârstă >50 ani | `low` | D-dimeri cresc fiziologic cu vârsta. Prag ajustat: vârstă × 10 ng/mL (după 50 ani). |

#### Cauze Trombotice (necesită suspiciune clinică!)
| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| thrombosis | Tromboză Venoasă / EP | `moderate` | Posibil dacă există suspiciune clinică (scor Wells). D-dimerii EXCLUD TEV doar dacă probabilitate pre-test scăzută. |

**NOTĂ CRITICĂ:** D-dimerii NU confirmă TEV - doar îl EXCLUD dacă probabilitate pre-test scăzută!
Screening trombofilie: DOAR după TEV confirmat, la distanță (min. 3 luni), fără anticoagulant.

---

### Pattern: TT Izolat Prelungit

| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| dysfibrinogenemia | Disfibrinogenemie | `high` | Fibrinogen calitativ anormal. |
| heparin_tt | Efect Heparină (TT) | `high` | TT foarte sensibil la heparină. |
| dabigatran_effect | Efect Dabigatran | `high` | Dabigatran prelungește marcat TT (inhibitor direct al trombinei). |

---

### DOAC Activ cu Laborator Normal

| ID | Diagnostic | Probabilitate | Descriere |
|----|------------|---------------|-----------|
| doac_xa_active | DOAC anti-Xa activ | `high` | Rivaroxaban/Apixaban/Edoxaban activ. PT-ul nu este un indicator de încredere. |
| doac_iia_active | DOAC anti-IIa activ | `high` | Dabigatran activ. TT este cel mai sensibil test pentru detectare. |

---

## 3. Recomandări

### aPTT Izolat Prelungit
- Test de mixaj CORECTEAZĂ → Deficit de factor confirmat
- Dozează factorii individuali: VIII, IX, XI
- Test de mixaj NU CORECTEAZĂ → Inhibitor confirmat
- ATENȚIE: APS = risc TROMBOTIC, nu hemoragic!
- Dacă sângerare: consideră hemofilie dobândită (anti-FVIII)
- Efectuează test de mixaj pentru diferențiere deficit vs inhibitor
- ATENȚIE: aPTT prelungit NU exclude trombofilie (anticoagulant lupic)
- Deficit F.XII: NU cauzează sângerare clinică - anomalie de laborator fără semnificație hemoragică.
- **NOTĂ vWD: aPTT prelungit apare DOAR când FVIII <30-40%. Multe cazuri de vWD au aPTT NORMAL!**

### PT Izolat Prelungit
- PT-ul nu este un indicator de încredere pentru anti-Xa DOAC
- Pentru Dabigatran, TT este mai sensibil decât PT - verifică TT

### PT și aPTT Prelungite
- Diferențiază hepatic vs Vit.K: dozează Factor V (normal în deficit Vit.K)
- Afibrinogenemie congenitală: AR, incidență ~1:1.000.000

### Timp de Sângerare (BT) Prelungit
- **IMPORTANT: vWD = cea mai frecventă tulburare de sângerare. aPTT NORMAL în >50% din cazuri!**
- **NOTĂ: BT = test depășit. ISTH/BSH recomandă PFA-100 sau vWF:Ag/RCo.**
- Frotiu periferic OBLIGATORIU: exclude pseudotrombocitopenie și microangiopatie (schizocite)

### D-dimeri Crescuți
- D-dimerii NU confirmă TEV - doar o EXCLUD dacă probabilitate pre-test scăzută
- Cauze frecvente non-trombotice: infecție, inflamație, cancer, sarcină, post-operator, vârstă
- Screening trombofilie: DOAR după TEV confirmat, la distanță (min. 3 luni), fără anticoagulant
- Prag ajustat vârstă (>50 ani): vârstă × 10 ng/mL (ex: 70 ani → 700 ng/mL)

### DOAC
- PT-ul nu este un indicator de încredere pentru anti-Xa DOAC
- TT normal poate apărea la niveluri terapeutice scăzute de Dabigatran

---

## 4. Avertismente (Warnings)

| Condiție | Mesaj |
|----------|-------|
| Scor 4T ≥ 6 (HIT High) | ATENȚIE: Scor 4T = X/8 - Probabilitate ridicată HIT. Contactați clinicianul curant URGENT. |
| Scor 4T 4-5 (HIT Intermediate) | Suspiciune HIT: Scor 4T = X/8 - Testează anti-PF4/heparină |
| INR ≥ 6 | URGENȚĂ: INR X - PLASMĂ INCOAGULABILĂ! Risc hemoragic major. |
| PT > 25s sub AVK | PT >25s - risc hemoragic crescut sub AVK |
| Mixing test nu corectează | TEST DE MIXAJ NU CORECTEAZĂ → Inhibitor prezent! |
| ISTH ≥ 5 | URGENȚĂ: CID MANIFEST (Scor ISTH X/8) - Corelație clinică urgentă necesară. |
| ISTH 3-4 | Suspiciune CID (Scor ISTH X/8) - monitorizare strânsă! |
| Fibrinogen < 50 | AFIBRINOGENEMIE: Risc hemoragic sever! Evaluare urgentă necesară. |
| Fibrinogen < 100 | Fibrinogen < 100 mg/dL: Risc hemoragic crescut la proceduri! |
| Trombocite < 50.000 | Trombocite <50.000 - Risc hemoragic crescut la proceduri invazive. |
| Trombocite < 20.000 | URGENȚĂ: Trombocite <20.000 - risc hemoragie spontană SNC! |
| Trombocitopenie severă/critică | TROMBOCITOPENIE [SEVERĂ/CRITICĂ]: [descriere risc] |
| D-dimeri crescuți | ATENȚIE: D-dimerii sunt NESPECIFICI! Corelație clinică OBLIGATORIE. |
| DOAC activ | PT-ul nu este un indicator de încredere pentru DOAC |

---

## 5. Scoruri Clinice

### Scor ISTH pentru CID

| Parametru | 0 puncte | 1 punct | 2 puncte | 3 puncte |
|-----------|----------|---------|----------|----------|
| **Trombocite** | >100 | 50-100 | <50 | - |
| **D-dimeri** | <500 | - | 500-2000 | >2000 |
| **PT prelungire** | <3s | 3-6s | >6s | - |
| **Fibrinogen** | >100 | ≤100 | - | - |

**Interpretare:**
- **≥5 puncte:** CID MANIFEST (overt DIC)
- **3-4 puncte:** Posibil CID non-manifest - repetă la 24-48h
- **<3 puncte:** CID puțin probabil

### Scor 4T pentru HIT

**Interpretare:**
- **0-3 puncte:** Probabilitate scăzută HIT (<5%) - HIT puțin probabil
- **4-5 puncte:** Probabilitate intermediară HIT (~14%) - Testează anti-PF4/heparină
- **6-8 puncte:** Probabilitate RIDICATĂ HIT (~64%) - OPREȘTE heparina!

### Index Rosner (Mixing Test)

**Formula:** `Rosner Index = ((aPTT mix - aPTT normal) / aPTT pacient) × 100`

**Interpretare:**
- **≤11%:** Corectează → sugerează deficiență de factori
- **11-15%:** Zonă gri → necesită investigații suplimentare
- **>15%:** Nu corectează → sugerează prezența unui inhibitor

---

## 6. Intervale de Referință

| Test | Min | Max | Unitate | Critic Low | Critic High |
|------|-----|-----|---------|------------|-------------|
| PT | 11 | 13.5 | s | - | 30 |
| INR | 0.9 | 1.2 | - | - | 6.0 |
| aPTT | 25 | 40 | s | - | 80 |
| TT | 14 | 19 | s | - | 40 |
| Fibrinogen | 200 | 400 | mg/dL | 100 | 700 |
| Trombocite | 150 | 400 | ×10³/µL | 50 | - |
| D-dimeri | 0 | 500 | ng/mL | - | 2000 |
| Timp sângerare | 2 | 7 | min | - | 15 |

---

## 7. Scenarii Educaționale

### Coagulopatii Congenitale

| Scenariu | Factori Afectați |
|----------|------------------|
| Hemofilie A | F8 |
| Hemofilie B | F9 |
| Hemofilie C | F11 |
| Deficit Factor XII | F12 |
| Boala von Willebrand | vWF, F8 |
| Purpura Trombocitopenică | PLT |

### Deficite Dobândite

| Scenariu | Factori Afectați |
|----------|------------------|
| Deficit Vitamina K | F2, F7, F9, F10, PC, PS |
| Insuficiență Hepatică | F2, F5, F7, F9, F10, F11, F12, F13, FBG, AT, PC |

### Trombofilie

| Scenariu | Factori Afectați |
|----------|------------------|
| Sindrom Antifosfolipidic | - (manifestare de laborator, nu deficit) |
| Trombofilie | - (hipercoagulabilitate) |

### CID - Progresie Fazică

| Scenariu | Factori Afectați |
|----------|------------------|
| CID - Faza Activare | FBG, PLT |
| CID - Faza Consum | F2, F5, F8, F10, FBG, PLT |
| CID - Faza Hemoragică | F2, F5, F8, F10, FBG, PLT |

### Anticoagulante

| Scenariu | Factori Afectați | Mecanism |
|----------|------------------|----------|
| Warfarină/AVK | F2, F7, F9, F10, PC, PS | Inhibă sinteza factorilor Vit.K dependenți |
| Heparină UFH | IIa, F10a | Potențează AT → inhibă IIa și Xa |
| LMWH | F10a | Predominant anti-Xa |
| DOAC anti-Xa | F10a | Rivaroxaban, Apixaban, Edoxaban |
| DOAC anti-IIa | IIa | Dabigatran |
| Antiagregant | PLT | Aspirină, Clopidogrel - inhibă funcția trombocitară |

---

## 8. Frecvența Deficitelor de Factori (Referință)

### Deficite Frecvente
| Factor | Boală | Frecvență |
|--------|-------|-----------|
| vWF | Boala von Willebrand | **1:100** (cea mai frecventă!) |
| F8 | Hemofilia A | 1:5.000-10.000 bărbați |
| F9 | Hemofilia B | 1:25.000-30.000 bărbați |

### Deficite Rare
| Factor | Boală | Frecvență |
|--------|-------|-----------|
| F11 | Hemofilia C | 1:100.000 (8% la evrei Ashkenazi) |
| F7 | Deficit Factor VII | 1:300.000-500.000 |

### Deficite Foarte Rare
| Factor | Frecvență |
|--------|-----------|
| F5, F10 | ~1:1.000.000 |
| F2, F13 | ~1:2.000.000 |
| FBG (afibrinogenemie) | ~1:1.000.000 |

### Notă despre Factor XII
- Deficitul de F.XII este **frecvent ca anomalie de laborator**
- **NU cauzează sângerare** - nu necesită tratament
- Este o descoperire incidentală, nu o boală hemoragică

---

## Note pentru Editare

### Cum să modifici diagnosticele:
1. Deschide `engine/interpreter.ts`
2. Caută funcția `interpretLabValues()`
3. Găsește blocul corespunzător pattern-ului (ex: `else if (apttHigh && !ptHigh)`)
4. Modifică `name`, `description`, `probability`, sau `suggestedTests`

### Cum să modifici notele clinice ale factorilor:
1. Deschide `engine/factors.ts`
2. Găsește factorul dorit (ex: `F8:`)
3. Modifică câmpul `clinicalNote`
4. **Pentru text roșu:** folosește markeri `!!text!!` (ex: `!!URGENȚĂ!!` va apărea în roșu)

### Cum să modifici intervalele de referință:
1. Deschide `engine/coagulation.ts`
2. Găsește `LAB_RANGES`
3. Modifică `min`, `max`, `criticalLow`, sau `criticalHigh`

---

*Document actualizat la: 2026-01-18*
