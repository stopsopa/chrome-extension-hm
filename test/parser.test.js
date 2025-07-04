import test from "node:test";
import assert from "node:assert/strict";
import parser from "../extension/parser.js";
test("parser", (t) => {
  const result = parser(`
    
    prod: sso-jwt eyJhbGciO.ICJiYXNpYyIsICJ0e.hLmdvZGO-xKdSbpemELPgYU.i-eq7lKZfw01rGh1z1Hosuga0uB-imNik5-4CwQQRiF-w0kMg
ote: sso-jwt eyJhbGc.CJmYWN0b3JzIjyruwJbGHozaajnS.Pgb3qmDL16OjQFjX62gI58ozk3P2-3kh2m-ywmrNC7hzDtGsFsNghE1vPFJqgRFuuakQrJh4Pw

  test:   sso-jwt eyJh.iAiY2VydCIsICJmYNTN9.MKhZUXjcvrqS.Zij2_Rl.3JE052Iu1lX927elO_7xVVgi_fmv8w_Clf3qQbZiBIupFsQGAzu4XZA
dev:sso-jwt eyJhb.IsICJmYWN0b3JzIjogey.ogMTc1MTczODU1M30.l4WFDuGU_g7tK.

abc: 
    
    `);

  assert.deepEqual(result, {
    prod: "sso-jwt eyJhbGciO.ICJiYXNpYyIsICJ0e.hLmdvZGO-xKdSbpemELPgYU.i-eq7lKZfw01rGh1z1Hosuga0uB-imNik5-4CwQQRiF-w0kMg",
    ote: "sso-jwt eyJhbGc.CJmYWN0b3JzIjyruwJbGHozaajnS.Pgb3qmDL16OjQFjX62gI58ozk3P2-3kh2m-ywmrNC7hzDtGsFsNghE1vPFJqgRFuuakQrJh4Pw",
    test: "sso-jwt eyJh.iAiY2VydCIsICJmYNTN9.MKhZUXjcvrqS.Zij2_Rl.3JE052Iu1lX927elO_7xVVgi_fmv8w_Clf3qQbZiBIupFsQGAzu4XZA",
    dev: "sso-jwt eyJhb.IsICJmYWN0b3JzIjogey.ogMTc1MTczODU1M30.l4WFDuGU_g7tK.",
  });
});
