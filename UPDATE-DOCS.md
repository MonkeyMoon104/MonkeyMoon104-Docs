# Aggiornare GitHub Pages

Questo repository/submodule contiene la documentazione pubblica visibile su:

```text
https://docs.monkeymoon104.it/
```

Per MinecraftBot, la cartella pubblicata e:

```text
mcbot/
```

URL finale:

```text
https://docs.monkeymoon104.it/mcbot/
```

## File da non toccare

Non cancellare o modificare senza motivo:

```text
CNAME
.nojekyll
index.html
```

`CNAME` mantiene il dominio custom. `.nojekyll` evita che GitHub Pages rompa i file generati dalla Javadoc.

## Ordine corretto per aggiornare le docs MinecraftBot

Questi comandi vanno lanciati dal repo principale `MinecraftBOT`, non direttamente da `docs`.

### 1. Assicurati che la versione API sia corretta

```powershell
git describe --tags --exact-match HEAD
```

Esempio:

```text
v1.0.6
```

Se il comando fallisce, il commit corrente non e taggato. In quel caso la Javadoc potrebbe usare l'ultimo tag precedente.

### 2. Rigenera le Javadocs

```powershell
.\gradlew.bat :mcbot-api:clean :mcbot-api:javadoc publishApiDocs
```

Il `clean` del modulo API e intenzionale: forza Gradle a rigenerare il titolo della Javadoc con la versione corretta.

### 3. Controlla il titolo generato

```powershell
Select-String -Path docs\mcbot\index.html -Pattern "mcbot-api"
```

Deve comparire la versione attesa:

```text
mcbot-api 1.0.6 API
```

### 4. Commit e push nel submodule docs

```powershell
git -C docs status --short
git -C docs add mcbot
git -C docs commit -m "docs(api): regenerate javadocs for 1.0.6"
git -C docs push origin master
```

### 5. Commit e push del puntatore nel repo principale

```powershell
git status --short
git add docs
git commit -m "docs(api): point to 1.0.6 javadocs"
git push origin mcbot
```

## Se GitHub Pages mostra ancora la versione vecchia

Controlla prima il file locale:

```powershell
Select-String -Path docs\mcbot\index.html -Pattern "mcbot-api"
```

Se localmente e corretto ma online no, aspetta qualche minuto e forza refresh del browser. GitHub Pages e il browser possono tenere cache.

Se localmente e ancora vecchio, hai rigenerato le Javadocs prima del tag o Gradle le ha considerate `UP-TO-DATE`. Ripeti il comando con `:mcbot-api:clean`.
