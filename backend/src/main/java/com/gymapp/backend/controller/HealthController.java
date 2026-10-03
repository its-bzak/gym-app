package com.gymapp.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gymapp.backend.dto.HealthResponse;
import com.gymapp.backend.service.HealthService;

@RestController
public class HealthController {

        private final HealthService healthService;

        public HealthController(HealthService healthService) {
                this.healthService = healthService;
        }

        @GetMapping("/health")
        public HealthResponse health() {
                return healthService.getHealth();
        }
}