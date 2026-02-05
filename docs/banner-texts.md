# Texte Banner - Cascada de Coagulare

Texte actualizate pentru modelul celular Hoffman-Monroe (24 pași).

---

## FAZA 1: INIȚIERE (SparkFrame) - 5 pași

| # | ID | Auto? | Text |
|---|-----|-------|------|
| 1 | dock-tf-vii | ✗ | În urma lezării vasculare, factorul tisular (FT) devine expus pe suprafața celulei exprimante de FT. FVII se leagă de FT și se formează complexul enzimatic FT–FVIIa, ancorat pe membrană. |
| 2 | dock-fix | ✗ | Complexul FT–FVIIa activează proteolitic factorul IX: FIX → FIXa (IXa). FIXa este generat în zona FT și poate contribui ulterior la formarea complexului tenazei intrinseci pe suprafața plachetară. |
| 3 | dock-fx | ✗ | În paralel, FT–FVIIa activează proteolitic factorul X: FX → FXa (Xa), predominant local, la nivelul aceleiași suprafețe celulare. |
| 4 | dock-fv | ✗ | FXa se asociază cu FVa (cofactor disponibil în cantități mici sau activat local), formând un complex protrombinazic (Xa–Va). |
| 5 | dock-fii | ✗ | Complexul protrombinazic incipient (Xa–Va) catalizează conversia protrombinei (FII) în trombină (FIIa), generând o cantitate mică de trombină de inițiere („scânteia" de trombină) care declanșează faza următoare. |

---

## FAZA 2: AMPLIFICARE (ExplosionFrame) - 10 pași

| # | ID | Auto? | Text |
|---|-----|-------|------|
| 1 | thrombin-arrives | ✓ | Cantități infime de trombină (FIIa) ajung la trombocit și declanșează faza de amplificare, activând receptorii PAR (receptori activați de protează) prin clivaj proteolitic. |
| 2 | par-bind | ✓ | Cantități infime de trombină (FIIa) ajung la trombocit și declanșează faza de amplificare, activând receptorii PAR (receptori activați de protează) prin clivaj proteolitic. |
| 3 | par-cleave | ✗ | Trombina se leagă de receptorul PAR1 și îl clivează proteolitic, expunând domeniul de activare. |
| 4 | par-activate | ✓ | Activarea PAR declanșează semnalizare trombocitară (↑Ca²⁺ intracelular), cu modificare de formă, degranulare și pregătirea suprafeței procoagulante. |
| 5 | split-vwf | ✗ | La locul hemostazei, trombina eliberează FVIII din complexul cu vWF și îl face disponibil pentru activare și funcție de cofactor. vWF are rol protectiv pentru FVIII: îl transportă și îl protejează în plasmă. |
| 6 | activate-fv | ✗ | Trombina activează factorul V: FV → FVa, cofactor esențial pentru formarea protrombinazei. |
| 7 | platelet-activate | ✓ | Trombocitul activat devine procoagulant: expune fosfatidilserină (PS) pe fața externă a membranei, furnizând platforma pentru asamblarea complexelor de coagulare. |
| 8 | dock-fva | ✓ | FVa se fixează pe membrana trombocitară activată, pregătind formarea protrombinazei (Xa–Va) în faza de propagare. |
| 9 | activate-fxi | ✗ | Pe suprafața trombocitului activat, trombina activează factorul XI: FXI → FXIa, amplificând ulterior generarea de FIXa. |
| 10 | dock-fviiia | ✓ | FVIIIa se fixează pe membrana trombocitară activată, pregătind asamblarea tenazei intrinseci (IXa–VIIIa) în faza de propagare. |

**Pragul Amplificare → Propagare:** Trombocitul este „armat" (PS expus + cofactorii V și VIII activați și disponibili pe membrană).

---

## FAZA 3: PROPAGARE (ExplosionFrame) - 5 pași

| # | ID | Auto? | Text |
|---|-----|-------|------|
| 1 | fixa-arrives | ✓ | FIXa (generat în inițiere și amplificat ulterior prin FXIa) ajunge pe suprafața trombocitului activat, unde devine disponibil pentru asamblarea tenazei. |
| 2 | form-tenase | ✗ | Pe membrana trombocitară bogată în fosfatidilserină (PS), în prezența Ca²⁺, FIXa se asociază cu FVIIIa, formând complexul tenazei intrinseci (IXa–VIIIa). |
| 3 | produce-fxa | ✗ | Tenaza intrinsecă activează eficient FX → FXa, generând cantități mari de FXa pe suprafața trombocitară. |
| 4 | form-prothrombinase | ✗ | FXa se asociază cu FVa pe membrana trombocitară, formând complexul protrombinazei (Xa–Va). |
| 5 | thrombin-burst | ✗ | Protrombinaza (Xa–Va) convertește rapid FII → FIIa, rezultând „explozia" de trombină (thrombin burst) care susține formarea cheagului. |

---

## FAZA 4: COAGULARE (ExplosionFrame) - 4 pași

| # | ID | Auto? | Text |
|---|-----|-------|------|
| 1 | cleave-fibrinogen | ✓ | Trombina (FIIa) clivează fibrinogenul (FI), eliberând fibrinopeptide și formând monomeri de fibrină. |
| 2 | polymerize-fibrin | ✓ | Monomerii de fibrină se asociază spontan și formează o rețea prin polimerizare (fibrină inițial ne-stabilizată). |
| 3 | activate-fxiii | ✓ | Trombina activează factorul XIII: FXIII → FXIIIa (în prezența Ca²⁺), pregătind stabilizarea cheagului. |
| 4 | crosslink-fibrin | ✗ | FXIIIa leagă covalent fibrele de fibrină, stabilizând cheagul. |

---

## Legendă

- **Auto? ✓** = pas automat (se execută singur după delay)
- **Auto? ✗** = pas manual (necesită click utilizator)
- Pașii consecutivi cu același text sunt consolidați vizual pe banner

---

## Condiție pentru intrarea în Propagare

```typescript
if (fixaArrived && fviiiaDocked && fvaDocked && fxiActivated) → Propagare
```

Toate condițiile trebuie îndeplinite:
- FIXa a migrat de la celula TF
- FVIIIa andocat pe membrană (variabila: `fviiiaDocked` - Factor VIII, nu VII!)
- FVa andocat pe membrană
- FXI activat (previne Hemofilia C)
