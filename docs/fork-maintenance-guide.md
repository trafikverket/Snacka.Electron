# Fork Maintenance Guide - Snacka.Electron

## Översikt

Snacka.Electron är en white label-variant av [Rocket.Chat.Electron](https://github.com/RocketChat/Rocket.Chat.Electron) med följande customizations:
- Eget namn (Snacka)
- Egna logotyper och ikoner
- URLs pekar på Trafikverkets egen dokumentation
- Anpassade GitHub Actions (artifacts istället för direkt publicering)

Denna guide dokumenterar processen för att uppdatera Snacka.Electron med nya versioner från det officiella Rocket.Chat.Electron-repot, samtidigt som era branding-ändringar behålls.

---

## Git Remote Setup

Snacka.Electron har två remotes:

| Remote | URL | Syfte |
|--------|-----|-------|
| `origin` | https://github.com/trafikverket/Snacka.Electron.git | Er egen repository |
| `github` | https://github.com/RocketChat/Rocket.Chat.Electron.git | Officiell Rocket.Chat.Electron |

### Verify Setup

```bash
git remote -v
```

Förväntat resultat:
```
github  https://github.com/RocketChat/Rocket.Chat.Electron.git (fetch)
github  https://github.com/RocketChat/Rocket.Chat.Electron.git (push)
origin  https://github.com/trafikverket/Snacka.Electron.git (fetch)
origin  https://github.com/trafikverket/Snacka.Electron.git (push)
```

---

## Branch Strategy

Använd denna branch-struktur:

```
main                 ← Din release-branch (med Snacka-branding)
  ├─ features/...    ← Feature branches
  └─ bugfix/...      ← Bugfix branches

upstream-main        ← Tracking branch för officiell Rocket.Chat.Electron
```

**Branch-regler:**
- `main`: Alltid stabilt, innehåller endast released versioner
- `upstream-main`: Lokal tracking-branch för upstreams default branch (`github/master`)
- `features/*`: Feature-utveckling från main
- `bugfix/*`: Bugfixes från main

I detta repo pekar remote `github` på Rocket.Chat.Electrons default branch `master`, men vi använder ändå det lokala namnet `upstream-main` för tracking-branchen.

För releasearbete bör ni normalt utgå från en officiell upstream-tag eller en upstream release-branch. `github/master` är främst användbar som löpande referens när ni vill se vad som har förändrats uppströms.

---

## List of Snacka Customizations

Dokumentera alla ändringar för enklare merge-hantering:

| Område | Filer | Ändring |
|--------|-------|--------|
| **Produktnamn** | `package.json` | `"productName": "Snacka"` |
| **Logotyper & Ikoner** | `build/icons/`, `src/public/` | Trafikverkets logotyp och design |
| **URLs** | `src/urls.ts`, `package.json` | `gosnacka.trafikverket.se`, dokumentations-URLs |
| **Metadata** | `package.json` | `"author"`, `"homepage"`, `"repository"` |
| **GitHub Actions** | `.github/workflows/` | Artifacts istället för publicering |
| **Build Assets** | Konfigurationsspecifika värden | Om tillämpligt |

---

## Uppdatera med ny version från officiellt repo

### Steg 1: Förbered arbetsträd (rekommenderat)

Använd git worktrees för att undvika att störa din nuvarande arbetsträd:

```powershell
# Skapa en worktree för uppdateringen
New-Item -ItemType Directory -Force -Path ..\Snacka.Electron-upstream-sync | Out-Null
git worktree add ../Snacka.Electron-upstream-sync -b upstream-sync-work main
Set-Location ..\Snacka.Electron-upstream-sync
yarn install
```

### Steg 2: Hämta senaste uppdateringar från officiell repo

```powershell
# Från den nya worktreen
git fetch github
```

### Steg 3: Bestäm målversion

Välj vilken version du vill uppdatera till:

```powershell
# Lista tillgängliga tags från officiell repo
git ls-remote --tags github

# Lista relevanta upstream-branches
git branch -r
```

Rekommendation:
- Välj i första hand en officiell tag, till exempel `4.13.0`
- Om upstream underhåller en release-branch för versionen, kan ni istället utgå från den, till exempel `github/release/4.11.x`

### Steg 4: Uppdatera upstream-main branch

```powershell
# Uppdatera lokal tracking-branch för upstreams default branch
git checkout upstream-main
# Om branchen inte finns ännu:
git checkout -b upstream-main github/master

# Rekommenderat för en release-uppdatering: skapa en temporär branch från vald tag
git checkout -b upstream-4.13.0 tags/4.13.0

# Alternativt från upstreams release-branch när en sådan finns
git checkout -b upstream-release-4.11.x github/release/4.11.x
```

### Steg 5: Merge till main med Snacka-ändringar

```powershell
# Gå tillbaka till main
git checkout main

# Merge uppdateringarna från vald upstream-källa
git merge upstream-4.13.0 --no-ff -m "Merge upstream Rocket.Chat.Electron 4.13.0"
```

Om ni utgår från en temporär branch skapad från tag eller release-branch, merge:ar ni den istället för `upstream-main`.

**Om det blir merge-konflikter:**

1. **Identifiera konflikter:**
   ```powershell
   git status
   ```

2. **Lös konflikter:**
   - Öppna varje fil markerad som konflikt
   - För Snacka-specifika ändringar: behåll ER version
   - För officiella ändringar: behåll UPSTREAM version
   - För båda: manuellt merge om det är nödvändigt

3. **Vanliga konflikt-filer:**
   - `package.json` - Behåll Snacka-värdena (namn, author, repository, etc.)
   - `package-lock.json` / `yarn.lock` - Använd `ours` strategi eller låt resolver hantera det
   - `build/icons/` - Behåll Snacka-ikoner
   - `src/public/` - Behåll Snacka-assets
   - `src/urls.ts` - Behåll Snacka-URLs

4. **Résolution-strategi:**
   ```powershell
   # Om du vet vilken part du vill ha:
   git checkout --ours package.json      # Behåll er version
   git checkout --theirs src/main.ts     # Behåll upstream version
   
   # Efter att ha löst alla:
   git add .
   git commit -m "Resolve merge conflicts - keep Snacka customizations"
   ```

### Steg 6: Validera och testa

```powershell
# Installera dependencies (kan behöva ominstalleras efter merge)
yarn install

# Verifiera att inga Snacka-ändringar råkades tas bort
git diff upstream-main -- package.json | Select-String -Pattern "productName|Snacka|trafikverket"

# Kör lint
yarn lint

# Kör tester
yarn test

# Bygga för att verifiera
yarn build
```

### Steg 7: Tag ny version

Snacka.Electron följer alltid samma versionsnummer som Rocket.Chat.Electron:

```powershell
# Format: {ROCKET.CHAT.VERSION} (inget v-prefix)
# Exempel: 4.13.0 från Rocket.Chat → 4.13.0 i Snacka

git tag -a 4.13.0 -m "Snacka release based on Rocket.Chat.Electron 4.13.0"

# Push till origin
git push origin main --tags
```

### Steg 8: Verifiera GitHub Actions

1. Gå till [Snacka.Electron Releases](https://github.com/trafikverket/Snacka.Electron/releases)
2. Vänta på att GitHub Actions bygger din tag
3. Verifiera att artifacts skapas korrekt
4. Se att release-artefakterna är Snacka (inte Rocket.Chat)

### Steg 9: Rensa worktree

```powershell
# Från huvudkatalogen
Set-Location ..\Snacka.Electron

# Ta bort worktree
git worktree remove ../Snacka.Electron-upstream-sync
```

---

## Vanliga Pitfalls och Solutions

### Problem: Merge-konflikter i lock-filer

**Orsak:** `yarn.lock` eller `package-lock.json` har divergerat.

**Solution:**
```powershell
# Lös genom att använda er version och installera om
git checkout --ours yarn.lock
yarn install
git add yarn.lock
```

### Problem: Tappade Snacka-branding efter merge

**Orsak:** Accepterade upstream-ändringar för customized-filer.

**Prevention:**
- Kör `git diff upstream-main` innan commit
- Verifiera att `package.json` har Snacka-värdena
- Kolla ikoner och assets

**Recovery:**
```powershell
# Återskapa från tidigare commit
git log --oneline | Select-String -Pattern "branding"
git checkout <earlier-commit> -- build/icons/ src/public/
```

### Versionering: Följ upstream direkt

**Snacka.Electron följer samma versionsnummer som officiell Rocket.Chat.Electron:**
- `4.13.0` = Både Rocket.Chat.Electron och Snacka.Electron
- Inga suffixar (`-snacka.1`, etc.)
- **Fördel:** Tydligt vilken version du kör, ingen förvirring
- **Note:** Om du gör säkerhetspatch mellan releases (dvs bugfixes på v4.13.0), använd git commits - tagga INTE nya versioner för dessa

---

## Exempel-Scenario: Uppdatera från 4.11.0 till 4.13.0

```powershell
# 1. Förbered
New-Item -ItemType Directory -Force -Path ..\Snacka.Electron-upstream-sync | Out-Null
git worktree add ../Snacka.Electron-upstream-sync -b sync-4.13.0 main
Set-Location ..\Snacka.Electron-upstream-sync
yarn install

# 2. Hämta uppdateringar
git fetch github

# 3. Skapa en temporär upstream-branch från vald releasekälla
git checkout -b upstream-v4.13.0 tags/v4.13.0

# 4. Gå till main och merge
git checkout main
git merge upstream-v4.13.0 --no-ff -m "Update to Rocket.Chat.Electron v4.13.0"

# 5. Lös konflikter (visa bara package.json som exempel)
# >> CONFLICT i package.json
git checkout --ours package.json
git add package.json
git commit -m "Resolve conflicts: keep Snacka customizations"

# 6. Testa
yarn install
yarn lint
yarn build

# 7. Tag ny version (samma som Rocket.Chat.Electron)
git tag -a v4.13.0 -m "Snacka release based on Rocket.Chat.Electron v4.13.0"

# 8. Push
git push origin main --tags

# 9. Rensa
Set-Location ..\Snacka.Electron
git worktree remove ../Snacka.Electron-upstream-sync
```

---

## Synpunkter på Ditt Föreslagna Arbetssätt

Ditt förslag fungerar, men här är några förbättringar:

### Förslag 1: Upprätthål en tracking-branch
- **Din approach:** Tagga direkt från officiell repo till main
- **Förbättring:** Upprätthål en dedikerad `upstream-main` branch som trackar `github/master`, men gör själva releaseuppdateringen från upstream-tag eller release-branch
- **Fördelar:** Enklare att se diff mellan versioner, hantera rollback, verifiera ändringar före merge

### Förslag 2: Versionering
- **Beslut:** Följ alltid exakt samma versionsnummer som upstream
- **Exempel:** Rocket.Chat.Electron `v4.13.0` blir Snacka.Electron `v4.13.0`
- **Fördelar:** Tydligt vilken Rocket.Chat.Electron-version releasen bygger på, lättare att backtracka issues

### Förslag 3: Dokumentera Customizations
- Upprätthål en lista över exakt vilka filer som är customized
- Gör merge-konflikter mycket enklare att hantera
- Framtida utvecklare kan snabbt se vad som är Snacka vs Rocket.Chat

---

## Snabb Referens - Uppdateringskommandoer

```powershell
# Hämta senaste från officiell repo
git fetch github

# Uppdatera upstream-tracking branch
git checkout upstream-main
# Om branchen inte finns ännu:
git checkout -b upstream-main github/master

# Skapa release-branch från vald upstream-tag
git checkout -b upstream-v4.13.0 tags/v4.13.0

# Merge till main
git checkout main
git merge upstream-v4.13.0 --no-ff

# Lös konflikter (om några)
# [edit files]
git add .
git commit

# Tag ny version (samma som upstream)
git tag -a v4.13.0 -m "Snacka release v4.13.0"

# Push
git push origin main --tags
```

---

## För Framtida Maintainers

- Håll denna guide uppdaterad med nya learnings
- Dokumentera varje merge-process i commit-messages
- Testa alltid innan du taggar - GitHub Actions kan inte alltid rädda en dålig release
- Om något går fel, kan du använda `git revert` eller `git reset` för att backa (men informera teamet)
