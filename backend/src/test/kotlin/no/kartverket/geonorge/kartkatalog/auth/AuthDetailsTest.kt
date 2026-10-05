package no.kartverket.geonorge.kartkatalog.auth

import java.util.Base64
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AuthDetailsTest {
    private val authDetails =
        """
        [
          {
            "authorized_parties": [
              {
                "orgno": {
                  "authority": "iso6523-actorid-upis",
                  "ID": "0192:314246756"
                },
                "resource": "resource_enkeltrettighet",
                "name": "VÅRLIG RELEVANT TIGER AS",
                "unit_type": "AS"
              }
            ],
            "resource": "urn:altinn:resource:resource_enkeltrettighet",
            "type": "ansattporten:altinn:resource",
            "resource_name": "Ressurs for enkeltrettigheter testing"
          }
        ]
        """.trimIndent()

    @Test
    fun `decodes plain JSON auth details`() {
        val organization = decodeAuthorizedOrganization(authDetails)

        assertEquals("314246756", organization.organizationNumber)
        assertEquals("VÅRLIG RELEVANT TIGER AS", organization.name)
    }

    @Test
    fun `decodes unpadded base64url auth details`() {
        val encoded =
            Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(authDetails.toByteArray())

        val organization = decodeAuthorizedOrganization(encoded)

        assertEquals("314246756", organization.organizationNumber)
        assertEquals("VÅRLIG RELEVANT TIGER AS", organization.name)
    }

    @Test
    fun `decodes standard base64 auth details`() {
        val encoded = Base64.getEncoder().encodeToString(authDetails.toByteArray())

        val organization = decodeAuthorizedOrganization(encoded)

        assertEquals("314246756", organization.organizationNumber)
        assertEquals("VÅRLIG RELEVANT TIGER AS", organization.name)
    }

    @Test
    fun `rejects missing auth details`() {
        assertFailsWith<InvalidAuthDetailsException> {
            decodeAuthorizedOrganization(null)
        }
    }

    @Test
    fun `rejects organization ID without nine digits after colon`() {
        val invalid = authDetails.replace("0192:314246756", "0192:123")

        assertFailsWith<InvalidAuthDetailsException> {
            decodeAuthorizedOrganization(invalid)
        }
    }
}
