package com.gymapp.backend.service;

import org.springframework.stereotype.Service;

import com.gymapp.backend.dto.HealthResponse;

@Service
public class HealthService {

        public HealthResponse getHealth() {
                return new HealthResponse("UP");
        }
}