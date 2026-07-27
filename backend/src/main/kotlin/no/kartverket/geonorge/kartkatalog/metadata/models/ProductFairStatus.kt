import kotlinx.serialization.Serializable

@Serializable
data class ProductFairStatus(
    val totalPercent: Double?,
    val findablePercent: Double?,
    val accessiblePercent: Double?,
    val interoperablePercent: Double?,
    val reusablePercent: Double?,
)
