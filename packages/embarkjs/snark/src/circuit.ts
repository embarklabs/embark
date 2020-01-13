import { CircuitSetup } from ".";
import * as snarkjs from "snarkjs";
const { unstringifyBigInts } = require("snarkjs/src/stringifybigint");

const LOG_PREFIX = "[embarkjs-snark]: ";

export default class Circuit {
  constructor(private setup: CircuitSetup) {
    this.setup.provingKey = unstringifyBigInts(this.setup.provingKey);
    this.setup.verificationKey = unstringifyBigInts(this.setup.verificationKey);
  }

  /**
   * Given public signals and a proof to prove those public signals can be verified,
   * generates an array of inputs the can be used to call the verifyProof function
   * in the verification contract (Solidity).
   *
   * @remarks Derived from the {@link https://github.com/iden3/snarkjs/blob/f2e5bc56b33aedbbbf7fed38b3f234d3d2b1adb7/cli.js#L365-L392 | "generatecall" snarkjs cli function}
   *
   * @param publicSignals - public inputs to be verified using the proof
   * @param proof - the proof used to verify the inputs are valid
   * @returns an array of solidity inputs that can be used to call the "verifyProof"
   * function of the deployed vertificadtion contract
   */
  private generateSolidityInputs(publicSignals, proof): string[] {
    publicSignals = unstringifyBigInts(publicSignals);
    proof = unstringifyBigInts(proof);

    const p256 = (n) => {
      let nstr = n.toString(16);
      while (nstr.length < 64) { nstr = "0" + nstr; }
      nstr = `0x${nstr}`;
      return nstr;
    };

    let inputs = "";
    for (const publicSignal of publicSignals) {
      if (inputs !== "") { inputs = inputs + ","; }
      inputs = inputs + p256(publicSignal);
    }

    let S;
    if ((typeof proof.protocol === "undefined") || (proof.protocol === "original")) {
      S = [
        [proof.pi_a[0], proof.pi_a[1]],
        [proof.pi_ap[0], proof.pi_ap[1]],
        [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        [proof.pi_bp[0], proof.pi_bp[1]],
        [proof.pi_c[0], proof.pi_c[1]],
        [proof.pi_cp[0], proof.pi_cp[1]],
        [proof.pi_h[0], proof.pi_h[1]],
        [proof.pi_kp[0], proof.pi_kp[1]]
      ];
    } else if ((proof.protocol === "groth") || (proof.protocol === "kimleeoh")) {
      S = [
        [proof.pi_a[0], proof.pi_a[1]],
        [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        [proof.pi_c[0], proof.pi_c[1]]
      ];
    } else {
      throw new Error("InvalidProof");
    }

    const two56ify = (arr: any[]): any[] => {
      return arr.map(n => {
        if (Array.isArray(n)) {
          return two56ify(n);
        }
        return p256(n);
      });
    };
    S = two56ify(S);
    S.push([inputs]);
    return S;
  }

  public async calculate(inputs: any) {
    const circuit = new snarkjs.Circuit(this.setup.compiledCircuit);
    const witness = circuit.calculateWitness(inputs);
    const { proof, publicSignals } = snarkjs[this.setup.config.protocol].genProof(
      this.setup.provingKey,
      witness
    );

    return { proof, publicSignals };
  }

  public async verify(inputs: any) {
    console.log(`${LOG_PREFIX}NOTE -- Private inputs will **not** be sent to the blockchain. They are used to calculate the witness and generate a proof.`);
    if (!this.setup.verificationContract) {
      return console.error(`Error verifying inputs, verification contract for '${this.setup.name}' not found.`);
    }

    console.log(`${LOG_PREFIX}Calculating witness and generating proof...`);
    const { proof, publicSignals } = await this.calculate(inputs);
    const solidityInputs = this.generateSolidityInputs(publicSignals, proof);

    console.log(`${LOG_PREFIX}Verifying inputs on chain...`);
    return await this.setup.verificationContract.methods.verifyProof(...solidityInputs).call();
  }

  public async verifyOffChain(inputs) {
    console.log(`${LOG_PREFIX}Calculating witness and generating proof...`);
    const { proof, publicSignals } = await this.calculate(inputs);

    console.log(`${LOG_PREFIX}Verifying inputs off chain...`);
    return snarkjs[this.setup.config.protocol].isValid(this.setup.verificationKey, proof, publicSignals);
  }
}
