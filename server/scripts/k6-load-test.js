import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // ramp up to 10 users
    { duration: '3m', target: 10 }, // stay at 10 users
    { duration: '1m', target: 0 },  // ramp down
  ],
};

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER_ID = 'k6-user';

export default function () {
  group('Multi-file upload', function () {
    for (let i = 0; i < 5; i++) {
      const fileContent = 'k6 test file ' + i + ' ' + 'A'.repeat(10000);
      const payload = {
        file: http.file(fileContent, `file${i}.txt`),
      };
      const res = http.post(`${BASE_URL}/parse-file`, payload);
      check(res, { 'file uploaded': (r) => r.status === 200 });
      sleep(0.5);
    }
  });

  group('Multi-query', function () {
    for (let i = 0; i < 10; i++) {
      const fileId = 'some-file-id'; // Replace with actual fileId if needed
      const body = JSON.stringify({
        question: 'What is in the file?',
        model: 'gpt-4o',
      });
      const params = { headers: { 'Content-Type': 'application/json' } };
      const res = http.post(`${BASE_URL}/ask-file/${fileId}`, body, params);
      check(res, { 'query ok': (r) => r.status === 200 || r.status === 404 });
      sleep(0.2);
    }
  });

  group('File deletion', function () {
    const fileId = 'some-file-id'; // Replace with actual fileId if needed
    const res = http.del(`${BASE_URL}/files/${fileId}`);
    check(res, { 'file deleted': (r) => r.status === 200 || r.status === 404 });
    sleep(0.5);
  });
} 