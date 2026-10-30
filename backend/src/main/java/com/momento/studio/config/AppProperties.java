package com.momento.studio.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Storage storage = new Storage();
    private Simulation simulation = new Simulation();
    private Queue queue = new Queue();
    private RateLimit rateLimit = new RateLimit();
    private DevApi devApi = new DevApi();
    private Cors cors = new Cors();
    private Auth auth = new Auth();

    @Getter
    @Setter
    public static class Auth {
        private String cookieName = "momento_session";
        private boolean cookieSecure = false;
        private int sessionDays = 30;
    }

    @Getter
    @Setter
    public static class Storage {
        private String uploadDir = "./data/uploads";
        private String resultDir = "./data/results";
    }

    @Getter
    @Setter
    public static class Simulation {
        private long assetCheckDelayMs = 1800;
        private long generateDelayMs = 4200;
        private long finalizeDelayMs = 1500;
        private String failureStage = "";
        private String failureMessage = "";
    }

    @Getter
    @Setter
    public static class Queue {
        private String streamKey = "momento:tasks";
        private String consumerGroup = "momento-workers";
        private String consumerPrefix = "momento-worker";
        private int consumers = 2;
        private int maxRetries = 3;
        private long dispatchIntervalMs = 10_000;
        private long dispatchInitialDelayMs = 30_000;
        private long pollBlockMs = 2_000;
    }

    @Getter
    @Setter
    public static class RateLimit {
        private int tasksPerMinute = 12;
    }

    @Getter
    @Setter
    public static class DevApi {
        private boolean enabled = true;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
    }
}
