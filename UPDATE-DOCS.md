# MonkeyMoon104 Docs

Public documentation hub for MonkeyMoon104 projects.

This repository is published through GitHub Pages and is available at:

https://docs.monkeymoon104.it/

## Structure

Each project has its own folder inside the repository:

```text
.
├── CNAME
├── .nojekyll
├── index.html
├── mcbot/
│   └── index.html
└── buildinfra/
    └── index.html
````

Example URLs:

```text
https://docs.monkeymoon104.it/mcbot/
https://docs.monkeymoon104.it/buildinfra/
```

## Root files

### `CNAME`

Contains the custom domain used by GitHub Pages:

```text
docs.monkeymoon104.it
```

Do not delete this file.

### `.nojekyll`

Disables Jekyll processing on GitHub Pages.

This is useful for generated documentation such as Javadocs.

### `index.html`

Main landing page for:

```text
https://docs.monkeymoon104.it/
```

It should link to all available project documentation folders.

## Adding a new project

To add documentation for a new project, create a new folder using a short lowercase project name.

Example:

```text
myproject/
```

The project documentation should contain its own `index.html`:

```text
myproject/index.html
```

The final URL will be:

```text
https://docs.monkeymoon104.it/myproject/
```

## Updating project documentation

Each private project should update only its own folder.

For example, the MinecraftBot project should only write to:

```text
mcbot/
```

and should not modify:

```text
CNAME
.nojekyll
index.html
buildinfra/
other-projects/
```

Recommended Gradle output target example:

```gradle
into(layout.projectDirectory.dir('docs/mcbot'))
```

For another project:

```gradle
into(layout.projectDirectory.dir('docs/buildinfra'))
```

## Publishing changes

After generating or updating docs:

```bash
git add <project-folder> .nojekyll
git commit -m "Update <project-name> docs"
git push
```

Example:

```bash
git add mcbot .nojekyll
git commit -m "Update MinecraftBot docs"
git push
```

## Notes

This repository must contain only public documentation files.

Do not commit private source code, configuration files, secrets, build scripts, or project internals.
```
