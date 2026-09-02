package id.buyaelvisyam.app.ui.screens

import kotlin.math.ceil
import kotlin.math.max

/**
 * Shared utilities used by HomeScreen and ArticleDetailScreen.
 * Centralised here to avoid duplicating the same logic in both files.
 */

/** Returns the ISO date portion (YYYY-MM-DD) of a date-time string, or the full string if shorter. */
internal fun formatDate(dateStr: String): String =
    if (dateStr.length >= 10) dateStr.substring(0, 10) else dateStr

/** Estimates reading time in minutes based on a ~200 wpm reading speed. Minimum 1 minute. */
internal fun calculateReadingMinutes(content: String): Int {
    val words = content
        .replace(Regex("<[^>]+>"), " ")
        .trim()
        .split(Regex("\\s+"))
        .count { it.isNotEmpty() }
    return max(1, ceil(words.toDouble() / 200.0).toInt())
}
