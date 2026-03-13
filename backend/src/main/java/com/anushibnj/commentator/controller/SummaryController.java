package com.anushibnj.commentator.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.anushibnj.commentator.model.SummarizeRequest;
import com.anushibnj.commentator.model.SummarizeResponse;
import com.anushibnj.commentator.service.SummaryService;

/**
 * REST controller exposing the summarization endpoint.
 * CORS is configured to allow requests from the Vite dev server.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:4173"})
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    /**
     * POST /api/summarize
     * Accepts a SummarizeRequest and returns a generated work log summary.
     *
     * @param request the incoming summarize request
     * @return 200 OK with the generated summary
     */
    @PostMapping("/summarize")
    public ResponseEntity<SummarizeResponse> summarize(@RequestBody SummarizeRequest request) {
        SummarizeResponse response = summaryService.summarize(request);
        return ResponseEntity.ok(response);
    }
}
