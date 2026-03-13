package com.anushibnj.commentator.model;

import java.util.List;

/**
 * Request payload sent from the frontend containing ticket context and snippet items.
 */
public record SummarizeRequest(
        String ticketId,
        List<SnippetItem> items
) {

    /**
     * An individual snippet item — text, code, or an image (base64 encoded).
     */
    public record SnippetItem(
            String type,
            String content
    ) {}
}
