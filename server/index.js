const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
	"03225ff98837a86834987600ab886bf8596ba32695f14dd412d90d6ff80012914e": 100,
	"02e1782a387cee460467223df6b2f4f1ffe749e56320ff3d94eee31c4cae5e7949": 50,
	"0311fa2dab22e064344970df32cc8408fa8b0af9f8ae8c71ff8387f2fe07b6d8d4": 75,
};

app.get("/balance/:address", (req, res) => {
	const { address } = req.params;
	const balance = balances[address] || 0;
	res.send({ balance });
});

app.post("/send", (req, res) => {
	const { signature, msg, sender } = req.body;
	const { amount, recipient } = msg;

	const msgHex = keccak256(Uint8Array.from(msg));
	const sign = {
		...signature,
		r: BigInt(signature.r),
		s: BigInt(signature.s),
	};
	const isValid = secp.secp256k1.verify(sign, msgHex, sender);

	if (!isValid) {
		return res.status(500).send("ERROR");
	}

	setInitialBalance(sender);
	setInitialBalance(recipient);

	if (balances[sender] < amount) {
		res.status(400).send({ message: "Not enough funds!" });
	} else {
		balances[sender] -= amount;
		balances[recipient] += amount;
		res.send({ balance: balances[sender] });
	}
});

app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
	if (!balances[address]) {
		balances[address] = 0;
	}
}
