import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 100 }, // naik ke 100 user dalam 10 detik
        { duration: '30s', target: 100 }, // tetap 10 user selama 30 detik
        { duration: '10s', target: 0 },  // turun lagi ke 0 user
    ],
};

export default function () {
    const res = http.get('https://ngevent-stg.devopsjogja.com/events'); // ganti dengan URL API kamu

    // Cek status respons
    check(res, {
        'status code 200': (r) => r.status === 200,
    });

    sleep(1); // jeda antar request per user virtual
}
