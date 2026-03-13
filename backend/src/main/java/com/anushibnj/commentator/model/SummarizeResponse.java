package com.anushibnj.commentator.model;

/**
 * Response payload returned to the frontend containing the LLM-generated summary.
 */
public record SummarizeResponse(String summary) {}
