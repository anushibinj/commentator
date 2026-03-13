package com.anushibnj.commentator.service;

import com.anushibnj.commentator.model.SummarizeRequest;
import com.anushibnj.commentator.model.SummarizeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.Media;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Stateless service that assembles a multimodal prompt from the incoming request
 * and proxies it to the configured LLM via Spring AI's ChatClient.
 */
@Service
public class SummaryService {

    private static final Logger log = LoggerFactory.getLogger(SummaryService.class);

    private static final String SYSTEM_PROMPT =
            "You are writing a work log entry based on a developer's notes from a work session. " +
            "Summarise what was done in plain, clear sentences — the kind a developer would actually write. " +
            "Do not use bullet points. Write in past tense. Keep it concise and factual. " +
            "Do not use formal or academic words like 'pertinent', 'endeavoured', 'facilitate', 'utilize', " +
            "'leverage', 'synthesize', 'cohesive', or 'aforementioned'. " +
            "Just say what happened, what broke, what was fixed, and what the outcome was.";

    private final ChatClient chatClient;

    public SummaryService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * Assembles a multimodal prompt from the request and invokes the LLM.
     *
     * @param request the summarize request containing ticket info and snippets
     * @return a SummarizeResponse with the generated narrative
     */
    public SummarizeResponse summarize(SummarizeRequest request) {
        StringBuilder textBuilder = new StringBuilder();
        textBuilder.append("Ticket: ").append(request.ticketId()).append("\n\n");
        textBuilder.append("Work Session Notes:\n");

        List<Media> mediaList = new ArrayList<>();

        for (SummarizeRequest.SnippetItem item : request.items()) {
            String type = item.type();
            String content = item.content();

            if ("IMAGE".equalsIgnoreCase(type)) {
                try {
                    byte[] imageBytes = Base64.getDecoder().decode(content);
                    Media media = Media.builder()
                            .mimeType(MimeTypeUtils.IMAGE_JPEG)
                            .data(imageBytes)
                            .build();
                    mediaList.add(media);
                    textBuilder.append("[Screenshot attached]\n");
                } catch (IllegalArgumentException e) {
                    log.warn("Failed to decode base64 image, skipping: {}", e.getMessage());
                    textBuilder.append("[Image could not be decoded]\n");
                }
            } else {
                // TEXT or CODE
                textBuilder.append(content).append("\n\n");
            }
        }

        SystemMessage systemMessage = new SystemMessage(SYSTEM_PROMPT);
        UserMessage userMessage = new UserMessage(textBuilder.toString(), mediaList);

        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        ChatResponse response = chatClient.prompt(prompt).call().chatResponse();

        String summary = response.getResult().getOutput().getText();
        return new SummarizeResponse(summary);
    }
}
