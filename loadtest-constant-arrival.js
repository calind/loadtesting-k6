// import necessary modules
import { check } from "k6";
import http from "k6/http";

let duration = __ENV.DURATION || "30s";
let user_count = __ENV.USER_COUNT || 50;
let duration_threshold = __ENV.DURATION_THRESHOLD || "p(95)<1000";
let rps = __ENV.RPS || 20;

export const options = {
    // define thresholds
    thresholds: {
        http_req_failed: ["rate<0.01"], // http errors should be less than 1%
        http_req_duration: [duration_threshold], // 99% of requests should be below 1s
    },
    // define scenarios
    scenarios: {
        // arbitrary name of scenario
        average_load: {
            executor: "constant-arrival-rate",
            duration: duration,
            rate: rps,
            timeUnit: "1s", // 20 iterations per second
            preAllocatedVUs: user_count * 30 / 100, // to ensure we have enough VUs
            maxVUs: user_count,
        },
    },
};

//setup executes once at the start and passes data to the main function (default) which a VUser executes
export function setup() {
    //get siteurl from command line parameter
    let target = __ENV.TARGET;
    if (!target) {
        throw new Error("Missing TARGET variable");
    }

    return { target };
}

export default function (data) {
    // make a GET request to the target URL
    let res = http.get(data.target);
    // check if the status code is 200
    check(res, {
        "status is 200": (r) => r.status === 200,
    });
}
