package id.buyaelvisyam.app.data.model

import com.google.gson.annotations.SerializedName

data class Article(
    val id: String,
    val title: String,
    val slug: String,
    val excerpt: String?,
    val content: String,
    val category: String,
    @SerializedName("cover_image") val coverImage: String?,
    val status: String,
    val views: Int,
    @SerializedName("is_featured") val isFeatured: Boolean,
    @SerializedName("author_id") val authorId: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    val author: String,
    @SerializedName("youtube_url") val youtubeUrl: String?,
    val categories: List<String>?
)
