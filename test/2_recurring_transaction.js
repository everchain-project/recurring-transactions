// const DelegatedWalletBlueprint = artifacts.require("DelegatedWallet");
// const ExampleTaskBlueprint = artifacts.require("ExampleTask");
// const GasPriceOracle = artifacts.require("GasPriceOracle");
// const PaymentDelegateBlueprint = artifacts.require("DecentralizedPaymentDelegate");
// const RequestFactory = artifacts.require("RequestFactory");
// const RecurringTransactionArtifact = artifacts.require("RecurringTransaction");
// const RecurringTransactionFactory = artifacts.require("RecurringTransactionFactory");
// const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

contract('Recurring Transaction Blueprint', function(accounts) {

/*
    var PaymentDelegate;
    var DelegatedWallet;

    var ExampleTask;
    var AlarmClock;
    var Alarm;

    var defaultAccount = accounts[0];
    var defaultDelegate = accounts[1];
    var priorityCaller = accounts[2];
    var attacker = accounts[3];

    var callData = '0x';
    var callDataWithMessage = '0x0eb07f780000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000';
    var callDataWithMessageAndValue = '0x16230b010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000';
    var callGas = 100000;
    var windowSize = minutes(60);
    var intervalValue = 1;
    var intervalUnit = 1;
    var maxIntervals = 2;

    it("initialize the recurring transaction blueprint", () => {
        return Promise.all([
            RecurringAlarmClockArtifact.new(),
            ExampleTaskBlueprint.new(),
            deployPaymentDelegate(),
            deployDelegatedWallet(),
        ])
        .then(instances => {
            AlarmClockBlueprint = instances[0];
            ExampleTask = instances[1];
            PaymentDelegate = instances[2];
            DelegatedWallet = instances[3];

            return RecurringAlarmClockFactory.new(RequestFactory.address, AlarmClockBlueprint.address)
        })
        .then(instance => {
            return instance.createAlarmClock(
                DelegatedWallet.address,
                PaymentDelegate.address,
                {from: defaultAccount}
            );
        })
        .then(tx => {
            return RecurringAlarmClockArtifact.at(tx.logs[0].args.alarmClock)
        })
        .then(instance => {
            AlarmClock = instance;
            return Promise.all([
                AlarmClock.setExecutionLimits(
                    [
                        0, // minutes(5), // scheduler.claimWindowSize
                        0, // minutes(3), // scheduler.freezePeriod
                        0, // minutes(5), // scheduler.reservedWindowSize
                    ],
                    {from: defaultDelegate}
                ),
                AlarmClock.setGasPriceOracle(GasPriceOracle.address, {from: defaultDelegate}),
                AlarmClock.setPriorityCaller(priorityCaller, {from: defaultDelegate})
            ])
        })
        .then(txReceipts => {
            return PaymentDelegate.schedule(AlarmClock.address, {from: defaultDelegate})
        })
    });

    it("start transaction with no call data and no call value", () => {
        return AlarmClock.start(
            ExampleTask.address,
            callData,
            [
                0, // callValue
                callGas,
                now() + minutes(1),
                windowSize,
                intervalValue,
                intervalUnit,
                maxIntervals,
            ],
            {from: defaultDelegate}
        );
    });

    it("fail to execute transaction early", () => {
        return getCurrentAlarm()
        .then(alarm => {
            return alarm.execute({
                from: attacker,
                gasPrice: 1000000000,
                gas: 1000000
            })
        })
        .then(tx => {
            assert(tx.logs[0].event == 'Aborted', "alarm execution was not properly aborted");
            return web3.eth.sendTransaction({
                to: AlarmClock.address,
                from: attacker,
                value: 0,
                gas: 1000000
            })
            .then(tx => {
                assert(false, "should not be able to manually trigger alarm clock")
            })
            .catch(err => {
                return Promise.resolve()
            })
        })
    })

    it("check correctness of alarm execution", () => {
        console.log("    ? check correctness of alarm execution")
        return getCurrentAlarm()
        .then(outputCurrentAlarm)
        .then(startAlarmExecutionEngine)
        .then(() => ExampleTask.getPastEvents('allEvents', {fromBlock: 0, toBlock: 'latest'}))
        .then(events => {
            assert(events.length == maxIntervals, "there should be " + maxIntervals + " events")
        })
    });

    it("start transaction with call data and no call value", () => {
        return AlarmClock.start(
            ExampleTask.address,
            callDataWithMessage,
            [
                0, // callValue
                callGas,
                now() + minutes(1),
                windowSize,
                intervalValue,
                intervalUnit,
                maxIntervals,
            ],
            {from: defaultDelegate}
        );
    });

    it("check correctness of alarm execution", () => {
        console.log("    ? check correctness of alarm execution")
        return getCurrentAlarm()
        .then(outputCurrentAlarm)
        .then(startAlarmExecutionEngine)
        .then(() => ExampleTask.getPastEvents('allEvents', {fromBlock: 0, toBlock: 'latest'}))
        .then(events => {
            assert(events.length == maxIntervals*2, "there should be " + maxIntervals*2 + " events")
        })
    });

    it("start transaction with call data and call value", () => {
        return AlarmClock.start(
            ExampleTask.address,
            callDataWithMessageAndValue,
            [
                1, // callValue
                callGas,
                now() + minutes(1),
                windowSize,
                intervalValue,
                intervalUnit,
                maxIntervals,
            ],
            {from: defaultDelegate}
        );
    });

    it("check correctness of alarm execution", () => {
        console.log("    ? check correctness of alarm execution")
        return getCurrentAlarm()
        .then(outputCurrentAlarm)
        .then(startAlarmExecutionEngine)
        .then(() => ExampleTask.getPastEvents('allEvents', {fromBlock: 0, toBlock: 'latest'}))
        .then(events => {
            assert(events.length == maxIntervals*3, "there should be " + maxIntervals*3 + " events")
        })
    });

    function startAlarmExecutionEngine(){
        return new Promise((resolve, reject) => {
            var AlarmExecutionEngine = setInterval(() => {
                fetchCurrentAlarm()
                .then(alarm => {
                    Alarm = alarm;
                    return getCurrentAlarmStatus(alarm)
                })
                .then(ready => {
                    if(ready){
                        executeAlarm(Alarm)
                        .then(getCurrentAlarm)
                        .then(alarm => {
                            if(alarm){
                                outputCurrentAlarm(alarm)
                            } else {
                                resolve('hello');
                                clearInterval(AlarmExecutionEngine);
                            }
                        })
                        .catch(err => reject(err))
                    } else {
                        //console.log("      alarm execution not ready. waiting...")
                    }
                })
                .catch(err => reject(err))
            }, 15000);
        })
    }

    function executeAlarm(alarm){
        return alarm.execute({
            gas: 2000000,
            gasPrice: 1000000000
        })
        .then(tx => {
            //console.log(tx.logs)
            var costInEther = web3.utils.fromWei((tx.receipt.gasUsed * 1000000000).toString(), 'ether');
            console.log("      executed! " + alarm.address.slice(0,6) + " cost " + costInEther + " ether (" + tx.receipt.gasUsed + " gas @ 1 gwei)")
            return tx;
        })
    }

    function outputCurrentAlarm(alarm){
        return Promise.all([
            alarm.requestData(),
            AlarmClock.currentInterval(),
            AlarmClock.maxIntervals(),
        ])
        .then(promises => {
            var requestData = promises[0];
            var currentInterval = promises[1];
            var maxIntervals = promises[2];

            var startTimestamp = requestData[2][10];
            var currentTimestamp = now();
            console.log("      alarm " + currentInterval + "/" + maxIntervals + " " + alarm.address);
        })
    }

    function getCurrentAlarmStatus(alarm){
        return alarm.requestData()
        .then(requestData => {
            var startTimestamp = requestData[2][10];
            var currentTimestamp = now();
            return (currentTimestamp >= startTimestamp);
        })
    }

    function fetchCurrentAlarm(){
        return AlarmClock.alarm()
        .then(alarmAddress => {
            if(alarmAddress == '0x0000000000000000000000000000000000000000'){
                return Promise.reject(new Error('no current alarm clock'));
            } else {
                return TransactionRequestInterface.at(alarmAddress);
            }
        })
    }

    function getCurrentAlarm(){
        return AlarmClock.alarm()
        .then(alarmAddress => {
            if(alarmAddress == '0x0000000000000000000000000000000000000000'){
                return Promise.resolve(null);
            } else {
                return TransactionRequestInterface.at(alarmAddress);
            }
        })
    }

    function deployPaymentDelegate(){
        var instance;

        return PaymentDelegateBlueprint.new({from: defaultAccount})
        .then(instance => {
            PaymentDelegate = instance;
            return instance;
        })
    }

    function deployDelegatedWallet(){
        var instance;
        return DelegatedWalletBlueprint.new()
        .then(_instance => {
            instance = _instance;
            return instance.initialize(defaultAccount)
            .then(tx => {
                return Promise.all([
                    instance.addDelegate(defaultDelegate),
                    instance.addDelegate(PaymentDelegate.address),
                ]);
            })
            .then(tx => {
                return web3.eth.sendTransaction({from: defaultDelegate, to: instance.address, value: ether(1)})
            })
            .then(tx => {
                return instance;
            })
        })
    }

    function ether(amountInWei){
        return web3.utils.toWei(amountInWei.toString(),'ether');
    }

    function minutes(toSeconds) {
        return Math.floor(60 * toSeconds);
    }

    function now() {
        return Math.floor(Date.now() / 1000);
    }
*/
});
