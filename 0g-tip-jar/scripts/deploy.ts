import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const TipJar = await hre.ethers.getContractFactory("TipJar");
  const tipJar = await TipJar.deploy();
  await tipJar.waitForDeployment();

  const address = await tipJar.getAddress();
  console.log("TipJar deployed to:", address);
  console.log("\nTo verify:");
  console.log(`npx hardhat verify ${address} --network 0g-galileo`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
