# Kotlin Skill

## Idiomatisk Kotlin

**Foretrekk `data class`** for DTOer og domeneobjekter — gir `equals`, `hashCode`, `copy` og `toString` gratis.

**Bruk `sealed class`/`sealed interface`** for domenestatus og feiltyper. `when`-uttrykk er da uttømmende og kompilatoren varsler om manglende cases.

**Nullsikkerhet** — bruk safe calls (`?.`), Elvis-operator (`?:`) og `requireNotNull()`. Unngå `!!` — det skjuler feil og gir dårlige stacktraces.

**Scope-funksjoner** — `apply` for konfigurasjon, `let` for null-sjekk og transformasjon, `also` for sideeffekter (f.eks. logging) uten å bryte en kjede.

**Extension functions** for domenespesifikk logikk — holder klassene rene uten arv.

## Typesikker konfigurasjon

Les alltid konfigurasjon fra miljøvariabler. Bruk et sealed class-mønster for å skille mellom miljøer:

```kotlin
sealed class AppConfig(val database: DatabaseConfig) {
    data class Prod(private val env: Map<String, String>) : AppConfig(
        DatabaseConfig(env.getValue("DB_JDBC_URL"), env.getValue("DB_USERNAME"), env.getValue("DB_PASSWORD"))
    )
    data object Local : AppConfig(
        DatabaseConfig("jdbc:postgresql://localhost:5432/myapp", "postgres", "postgres")
    )
    companion object {
        fun from(env: Map<String, String>) = when (env["ENV"]) {
            "prod" -> Prod(env)
            else -> Local
        }
    }
}
```

Aldri hardkode URL-er, passord eller API-nøkler i kode.

## Feilhåndtering

Definer domenespesifikke exceptions (`NotFoundException`, `ValidationException`). Håndter dem sentralt:
- **Spring Boot**: `@RestControllerAdvice` med RFC 7807 `ProblemDetail`
- **Ktor**: `StatusPages`-plugin

Aldri la exceptions forsvinne stille i tomme `catch`-blokker.

## Logging

```kotlin
private val logger = KotlinLogging.logger {}
logger.info { "Behandlet ressurs $id" }      // ✅ Strukturert, ingen PII
logger.info { "Bruker fnr=$fnr behandlet" }  // ❌ PII i log — GDPR-brudd
```

## Testing

Bruk **Kotest** og **MockK**. Test én ting per test med beskrivende navn:

```kotlin
@Test
fun `returnerer null når ressurs ikke finnes`() {
    every { repository.findById(999L) } returns null
    assertNull(service.find(999L))
}
```

Bruk **Testcontainers** for integrasjonstester mot database.

## Sjekkliste

- [ ] `data class` for DTOer og domeneobjekter
- [ ] Ingen `!!` uten eksplisitt begrunnelse
- [ ] Konfigurasjon fra miljøvariabler via sealed class — ingen hardkodede hemmeligheter
- [ ] Domenespesifikke exceptions med sentralisert håndtering
- [ ] Strukturert logging uten PII
- [ ] Tester for happy path og feilscenarioer
