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
            "You are writing a work log entry in the first person, as if the developer wrote it themselves. " +
            "Summarise what was done in plain, clear sentences — the kind a developer would actually write in their own words. " +
            "Do not use bullet points. Write in past tense. Keep it concise and factual. " +
            "Do NOT use third-person narrator phrases like 'the developer noted', 'I reported', 'I mentioned', 'I indicated', 'I stated'. " +
            "Just say what happened directly: 'Investigated the issue', 'Fixed the login bug', 'Did not complete the ticket — will spill to next sprint'. " +
            "Pay attention to how notes evolve over time. If an earlier note says something was not possible or unlikely, " +
            "and a later note contradicts it (e.g. it was done after all), connect them naturally — " +
            "for example: 'Did not think I would finish in time, but managed to fix all issues.' or " +
            "'Initially thought this would spill to next sprint, but ended up completing it.' " +
            "Do not list contradicting notes as separate flat sentences — weave them into a single coherent arc. " +
            "Do not use formal or academic words like 'pertinent', 'endeavoured', 'facilitate', 'utilize', " +
            "'leverage', 'synthesize', 'cohesive', or 'aforementioned'. " +
            "IMPORTANT: Do not infer, assume, or fabricate outcomes. " +
            "If the notes say something is in progress or being investigated, say exactly that — do not imply it was resolved or completed. " +
            "Only report what is explicitly stated. If the outcome is unknown, leave it unknown.";

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
