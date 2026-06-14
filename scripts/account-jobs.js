const accountService = require("../src/services/account.service");
const { pool } = require("../src/db/pool");

const jobs = {
  trials: accountService.processTrialExpirations,
  renewals: accountService.processRenewals,
  reconcile: accountService.reconcileProviderState,
  all: async () => {
    const trials = await accountService.processTrialExpirations();
    const renewals = await accountService.processRenewals();
    const reconcile = await accountService.reconcileProviderState();
    return { trials, renewals, reconcile };
  }
};

async function main() {
  const jobName = process.argv[2] || "all";
  const job = jobs[jobName];
  if (!job) throw new Error(`Unknown account job: ${jobName}`);
  const result = await job();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
