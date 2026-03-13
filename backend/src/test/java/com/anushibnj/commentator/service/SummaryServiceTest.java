package com.anushibnj.commentator.service;

import com.anushibnj.commentator.model.SummarizeRequest;
import com.anushibnj.commentator.model.SummarizeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.ModelResult;

import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SummaryServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec callResponseSpec;

    @Mock
    private ChatResponse chatResponse;

    @Mock
    private Generation generation;

    @Mock
    private org.springframework.ai.chat.model.ChatModel chatModel;

    private SummaryService summaryService;

    @BeforeEach
    void setUp() {
        when(chatClientBuilder.build()).thenReturn(chatClient);
        summaryService = new SummaryService(chatClientBuilder);
    }

    private void setupChatClientMock(String returnText) {
        when(chatClient.prompt(any(Prompt.class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(callResponseSpec);
        when(callResponseSpec.chatResponse()).thenReturn(chatResponse);
        when(chatResponse.getResult()).thenReturn(generation);

        var assistantMessage = new org.springframework.ai.chat.messages.AssistantMessage(returnText);
        when(generation.getOutput()).thenReturn(assistantMessage);
    }

    @Test
    void summarize_withTextItems_returnsLlmResponse() {
        setupChatClientMock("Today I worked on the authentication module.");

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-1234",
                List.of(
                        new SummarizeRequest.SnippetItem("TEXT", "Worked on auth"),
                        new SummarizeRequest.SnippetItem("CODE", "const token = jwt.sign(payload, secret);")
                )
        );

        SummarizeResponse response = summaryService.summarize(request);

        assertThat(response.summary()).isEqualTo("Today I worked on the authentication module.");
        verify(chatClient).prompt(any(Prompt.class));
    }

    @Test
    void summarize_includesTicketIdInPrompt() {
        setupChatClientMock("Summary text");

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-9999",
                List.of(new SummarizeRequest.SnippetItem("TEXT", "Some note"))
        );

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        summaryService.summarize(request);
        verify(chatClient).prompt(promptCaptor.capture());

        Prompt capturedPrompt = promptCaptor.getValue();
        assertThat(capturedPrompt.getInstructions()).hasSize(2);

        // First message should be SystemMessage
         assertThat(capturedPrompt.getInstructions().get(0))
                 .isInstanceOf(SystemMessage.class);
         assertThat(capturedPrompt.getInstructions().get(0).getText())
                 .contains("work log")
                 .contains("plain, clear sentences");

        // Second message should contain the ticket ID and text
        assertThat(capturedPrompt.getInstructions().get(1))
                .isInstanceOf(UserMessage.class);
        assertThat(capturedPrompt.getInstructions().get(1).getText())
                .contains("PROJ-9999")
                .contains("Some note");
    }

    @Test
    void summarize_withValidBase64Image_attachedsMediaAndMarksPlaceholder() {
        setupChatClientMock("Summary with image");

        // Create a valid base64 JPEG header
        byte[] fakeJpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        String base64Image = Base64.getEncoder().encodeToString(fakeJpegBytes);

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-IMG",
                List.of(new SummarizeRequest.SnippetItem("IMAGE", base64Image))
        );

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        summaryService.summarize(request);
        verify(chatClient).prompt(promptCaptor.capture());

        Prompt capturedPrompt = promptCaptor.getValue();
        UserMessage userMessage = (UserMessage) capturedPrompt.getInstructions().get(1);

        assertThat(userMessage.getText()).contains("[Screenshot attached]");
        assertThat(userMessage.getMedia()).hasSize(1);
    }

    @Test
    void summarize_withInvalidBase64Image_skipsImageAndLogsWarning() {
        setupChatClientMock("Summary without image");

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-BAD",
                List.of(new SummarizeRequest.SnippetItem("IMAGE", "not-valid-base64!!##"))
        );

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        summaryService.summarize(request);
        verify(chatClient).prompt(promptCaptor.capture());

        Prompt capturedPrompt = promptCaptor.getValue();
        UserMessage userMessage = (UserMessage) capturedPrompt.getInstructions().get(1);

        assertThat(userMessage.getText()).contains("[Image could not be decoded]");
        assertThat(userMessage.getMedia()).isEmpty();
    }

    @Test
    void summarize_withEmptyItems_stillCallsLlm() {
        setupChatClientMock("Empty session summary");

        SummarizeRequest request = new SummarizeRequest("PROJ-EMPTY", List.of());

        SummarizeResponse response = summaryService.summarize(request);

        assertThat(response.summary()).isEqualTo("Empty session summary");
        verify(chatClient).prompt(any(Prompt.class));
    }

    @Test
    void summarize_withMixedItems_processesAllCorrectly() {
        setupChatClientMock("Mixed summary");

        byte[] fakeBytes = new byte[]{1, 2, 3, 4};
        String base64 = Base64.getEncoder().encodeToString(fakeBytes);

        SummarizeRequest request = new SummarizeRequest(
                "PROJ-MIX",
                List.of(
                        new SummarizeRequest.SnippetItem("TEXT", "First I investigated the issue"),
                        new SummarizeRequest.SnippetItem("CODE", "throw new RuntimeException(\"NPE\");"),
                        new SummarizeRequest.SnippetItem("IMAGE", base64),
                        new SummarizeRequest.SnippetItem("TEXT", "Then I fixed the null check")
                )
        );

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        summaryService.summarize(request);
        verify(chatClient).prompt(promptCaptor.capture());

        Prompt capturedPrompt = promptCaptor.getValue();
        UserMessage userMessage = (UserMessage) capturedPrompt.getInstructions().get(1);

        assertThat(userMessage.getText())
                .contains("First I investigated the issue")
                .contains("throw new RuntimeException")
                .contains("[Screenshot attached]")
                .contains("Then I fixed the null check");
        assertThat(userMessage.getMedia()).hasSize(1);
    }
}
