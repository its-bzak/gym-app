package com.gymapp.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.gymapp.backend.service.HealthService;

class HealthControllerTests {

        @Test
        void healthReturnsUpStatus() throws Exception {
                MockMvc mockMvc = MockMvcBuilders
                                .standaloneSetup(new HealthController(new HealthService()))
                                .build();

                mockMvc.perform(get("/health"))
                                .andExpect(status().isOk())
                                .andExpect(content().json("{\"status\":\"UP\"}"));
        }
}