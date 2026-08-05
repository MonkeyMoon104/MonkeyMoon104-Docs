# UltimateBot addon development

UltimateBot 2 exposes two server-side extension points:

- `CombatModeProvider` creates a stateful combat session for each bot using the mode.
- `BotBrainProvider` replaces the complete built-in AI tick for each bot using the brain.

Both regular Paper plugins and jars hosted in `plugins/UltimateBot/addon/` use the same API contracts. A hosted addon is restarted with the server; replacing addon jars through `/reload` is intentionally unsupported.

Regular Paper plugins register through `UltimateBotAPI.get().getExtensions()` and retain the returned `ExtensionRegistration` until disable. Hosted addons use `AddonContext`, which owns those registration handles automatically.

## Dependency

```kotlin
repositories {
    maven("https://repo.monkeymoon104.it/releases")
    maven("https://repo.papermc.io/repository/maven-public/")
}

dependencies {
    compileOnly("com.monkey.ultimatebot:api:2.0.0")
    compileOnly("io.papermc.paper:paper-api:1.21.4-R0.1-SNAPSHOT")
}
```

The API and common artifacts must never be shaded into an addon. The addon engine rejects jars containing UltimateBot classes because duplicate class identities break provider casting and lifecycle cleanup.

## Hosted addon descriptor

Place `ultimatebot-addon.properties` under `src/main/resources/META-INF/`:

```properties
id=example-ai
name=Example Combat AI
version=1.0.0
api-version=2
main=com.example.ultimatebot.ExampleAddon
authors=DeveloperName
dependencies=
soft-dependencies=
native.1.21.11=com.example.ultimatebot.nms.v1_21_11.ExampleNativeAddon
```

`id` must be unique. Dependencies are addon IDs and are resolved before any entrypoint is initialized. A `native.<minecraft-version>` entry may replace the base entrypoint for one exact server version, allowing a single jar to contain isolated native implementations.

## Lifecycle

```java
public final class ExampleAddon implements UltimateBotAddon {
    private AddonContext context;

    @Override
    public void onLoad(AddonContext context) {
        this.context = Objects.requireNonNull(context, "context");
        context.registerBrain(new ExampleBrainProvider());
        context.registerCombatMode(new ExampleModeProvider());
    }

    @Override
    public void onDisable() {
        context = null;
    }
}
```

Registrations, listeners, scheduler tasks and owned `AutoCloseable` resources registered through `AddonContext` are released in reverse order. The resource scope exposes global, entity and asynchronous task methods backed by the active Paper/Folia scheduler. Completed one-shot tasks release their references immediately. UltimateBot closes all bot sessions before unloading addon classloaders.

## Full custom brain

A `BotBrainProvider` creates one `BotBrainSession` per bot. No mutable session is shared between bots unless the addon explicitly does so.

```java
public final class ExampleBrain implements BotBrainSession {
    private final BotBrainContext context;

    public ExampleBrain(BotBrainContext context) {
        this.context = Objects.requireNonNull(context, "context");
    }

    @Override
    public void tick(BrainTick tick) {
        tick.selectedTarget().ifPresent(target -> {
            context.control().lookAt(target);
            context.control().moveTowards(target, 2.8D);
            if (context.bot().getLocation().distanceSquared(target.getLocation()) <= 9.0D) {
                context.control().attack(target);
            }
        });
    }
}
```

When a custom brain is active, UltimateBot does not execute its healing, movement or combat decisions. Registry, bot identity, entity lifecycle, equipment policy and cleanup remain owned by UltimateBot.

A mode may reference a brain in `CombatModeDescriptor`. The brain must be registered first; while that mode is selected, its full brain owns the tick and the mode provider supplies metadata, profiles and kit. Removing the brain also removes dependent mode registrations so active bots can fall back safely.

## Native access

Native access is an intentionally unstable escape hatch:

```java
ServerPlayer bot = context.nativeAccess().requireBotHandle(ServerPlayer.class);
ServerLevel level = context.nativeAccess().requireLevelHandle(ServerLevel.class);
Optional<LivingEntity> target = context.nativeAccess().targetHandle(LivingEntity.class);
```

An addon importing NMS classes must compile a separate implementation for every supported Minecraft version and declare matching `native.<version>` entrypoints. The descriptor is validated before the version-specific class is loaded.

## Remote SDK

The SDK can list installed addons, modes and brains, select dynamic namespaced modes, assign a registered brain and reset a bot to its mode-provided brain. It cannot upload or execute addon jars remotely.

```java
client.listAddons();
client.listCombatModes();
client.listBrains();
client.updateBrain(botUuid, BrainKey.of("example", "expert-ai"));
client.resetBrain(botUuid);
```

`BotSettings.BuildStep#brain` and `BotSpawnRequest.Builder#brain` can also select a brain when the bot is first spawned.

## Safety contract

All Bukkit and NMS operations must run inside callbacks supplied by UltimateBot unless the API explicitly provides an immutable asynchronous snapshot. Addon jars execute with the server process privileges and must be treated as trusted code.
