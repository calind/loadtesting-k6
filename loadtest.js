// import necessary modules
import { check } from "k6";
import http from "k6/http";

let rampup_time = __ENV.RAMPUP_TIME || "10s";
let rampdown_time = __ENV.RAMPDOWN_TIME || "5s";
let duration = __ENV.DURATION || "30s";
let user_count = __ENV.USER_COUNT || 50;
let duration_threshold = __ENV.DURATION_THRESHOLD || "p(95)<1000";

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
            executor: "ramping-vus",
            stages: [
                // ramp up to average load of 20 virtual users
                { duration: rampup_time, target: user_count },
                // maintain load
                { duration: duration, target: user_count },
                // ramp down to zero
                { duration: rampdown_time, target: 0 },
            ],
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
