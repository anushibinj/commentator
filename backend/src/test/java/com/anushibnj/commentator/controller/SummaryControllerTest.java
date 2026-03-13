package com.anushibnj.commentator.controller;

import com.anushibnj.commentator.model.SummarizeRequest;
import com.anushibnj.commentator.model.SummarizeResponse;
import com.anushibnj.commentator.service.SummaryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SummaryController.class)
class SummaryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SummaryService summaryService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void postSummarize_returnsOkWithSummary() throws Exception {
        when(summaryService.summarize(any(SummarizeRequest.class)))
                .thenReturn(new SummarizeResponse("A cohesive work log summary."));

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-1234",
                List.of(new SummarizeRequest.SnippetItem("TEXT", "Worked on the login page"))
        );

        mockMvc.perform(post("/api/summarize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.summary", is("A cohesive work log summary.")));
    }

    @Test
    void postSummarize_withImageItem_returnsOk() throws Exception {
        when(summaryService.summarize(any(SummarizeRequest.class)))
                .thenReturn(new SummarizeResponse("Summary with image context."));

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-5678",
                List.of(
                        new SummarizeRequest.SnippetItem("TEXT", "Took a screenshot"),
                        new SummarizeRequest.SnippetItem("IMAGE", "base64encodedimage")
                )
        );

        mockMvc.perform(post("/api/summarize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary", is("Summary with image context.")));
    }

    @Test
    void postSummarize_withEmptyItems_returnsOk() throws Exception {
        when(summaryService.summarize(any(SummarizeRequest.class)))
                .thenReturn(new SummarizeResponse("Empty session."));

        SummarizeRequest request = new SummarizeRequest("PROJ-0", List.of());

        mockMvc.perform(post("/api/summarize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary", is("Empty session.")));
    }

    @Test
    void postSummarize_corsHeadersPresent_forViteDevServer() throws Exception {
        when(summaryService.summarize(any(SummarizeRequest.class)))
                .thenReturn(new SummarizeResponse("ok"));

        SummarizeRequest request = new SummarizeRequest("PROJ-1", List.of());

        mockMvc.perform(post("/api/summarize")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void optionsSummarize_corsPreflightSucceeds() throws Exception {
        mockMvc.perform(options("/api/summarize")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk());
    }
}
