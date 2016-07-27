//autofisher
var mineflayer = require('mineflayer');
var navigatePlugin = require('mineflayer-navigate')(mineflayer);
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
var async = require('async');
var vec3 = mineflayer.vec3;

if (process.argv.length < 4 || process.argv.length > 6) {
    console.log("Usage : node pkFisher.js <host> <port> [<name>] [<password>]");
    process.exit(1);
}

var bot = mineflayer.createBot({
    username: process.argv[4] ? process.argv[4] : "autofisher",
    verbose: true,
    port: parseInt(process.argv[3]),
    host: process.argv[2],
    password: process.argv[5]
});

navigatePlugin(bot);
blockFinderPlugin(bot);

var posChest = null;
var posFish = null;
var posFishX = null;
var posFishY = null;
var posFishZ = null;
var blockChest = null;
var direction = null;
var hlook = null;
var counter = 0;
var goldBlock = null;
var tempx = null;
var tempy = null;
var tempz = null;
var drop = false;
var cast = false;
var count2 = 0;
var spawncount = 0;
var setup = false;
var keep = false;
var result = null;

var status = 'init';

var master = '<username>'; //replace <username>
var spawnCommand = '/warp wild'; //common
var base = '<base teleport>'; //faction/region base teleport command
var nearBase = vec3(<x,y,z>); //replace with coords neaby fishing area, could be replaced with findRedstone function.
var caughtFish = "~!||| FISH CAUGHT |||!~";

bot.chatAddPattern(/^(?:\[[^\]]*\] )?([^ :]*) ?: (.*)$/, "chat", "Essentials chat");
bot.chatAddPattern(/^\[ ?([^ ]*) -> me ?] (.*)$/, "whisper", "Essentials whisper");

bot.on('spawn', function() { //better way of doing this, will update soon.
    spawncount += 1;
    console.log(spawncount);
    if (spawncount == 1) { //this part will need to be customized based on what server the bot is joining.
        console.log("Joined Server.");
        console.log("Doing /survival");
        bot.chat("/survival");
    }
    if (spawncount == 2) {
        setTimeout(function() {
            console.log("Starting Phase 2.");
            var sword_count = bot.inventory.count(267);
            if (sword_count > 0) { //swords mess up the bot, dont ask.
                console.log("Sword found.");
                bot.toss(267, null, 1, console.log("Tossed sword."));
            } else {
                console.log("No sword found.");
            }
            findLamp();
            console.log("Setting up: " + setup);
            if (setup == true) {
                console.log("Finding gold plates...");
                findGoldPlate();
            }
        }, 5000);
    }
    if (spawncount == 3) {
        if (setup == true) {
            console.log("Phase 3 started.");
            bot.chat(base);
            setTimeout(function() {
                console.log("Arrived at base.")
                var sword_count = bot.inventory.count(267);
                if (sword_count > 0) {
                    console.log("Sword found.");
                    bot.toss(267, null, 1, console.log("Tossed sword."));
                } else {
                    console.log("No sword found.");
                }
                status = 'walking to middle';
                bot.navigate.to(nearBase); //defined at start of script
            }, 5000);
        }
    }
});

//commands~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
bot.on('whisper', function(username, message) {
    if (username == bot.username) return;
    var command = message.split(' ');
    if (username == master) {
        switch (true) {
            case /^come$/.test(message):
                status == 'come';
                bot.navigate.to(bot.players[username].entity.position);
                break;
            case /^quit$/.test(message):
                bot.quit();
                break;
            default:
                console.log("Recieved chat message from: " + username + ", no command matched.");
                break;
        }
    }
});

//arrived commands~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
bot.navigate.on('arrived', function() {
    switch (status) {
        case 'walking to lapis: getting rod.':
            console.log("Arrived at lapis, getting rod...");
            setTimeout(function() {
                checkBlock(22);
                if (result == true) {
                    console.log("Success! Bot reached lapis.");
                    findRodChest();
                } else {
                    console.log("Error, not on at lapis block.");
                    status = 'walking to lapis: getting rod.';
                    findLapis();
                }
            }, 1000);
            break;
        case 'walking to lamp':
                checkBlock(123);
                if (result == true) {
                    console.log("Success! Bot reached lamp block.");
                    console.log("Finding nearest gold block...");
                    findGold();
                } else {
                    console.log("Error, not on lamp block.");
                    status = 'walking to lamp';
                    findLamp();
                }
            break;
        case 'spawning':
            console.log("Doing /warp wild.");
            bot.chat("/warp wild");
            break;
        case 'depositing broken rod':
            console.log('Depositing broken rod.');
            setTimeout(function() {
                console.log("Locating broken rod chest...");
                findBrokenRodChest();
            }, 100);
            break;
        case 'walking to gold plate.':
            console.log("Arrived at gold plate.");
            console.log("Executing '/warp wild'");
            bot.chat("/warp wild");
            break;
        case 'walking to middle':
            console.log("Locating nearest fishing spot...");
            setTimeout(function() {
                findLamp();
            }, 3000);
            break;
    }
});

//catching fish~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
bot.on('soundEffectHeard', function(soundName, position, volume, pitch) {
    if (soundName == 'random.splash') {
        if (status == 'fishing') {
            equipRod();
            var posSound = position;
            var posSoundX = position.x;
            var posSoundY = position.y;
            var posSoundZ = position.z;
            var posFishX = bot.entity.position.x;
            var posFishY = bot.entity.position.y;
            var posFishZ = bot.entity.position.z;
            var posSoundXf = Math.floor(posSoundX);
            var posSoundYf = Math.floor(posSoundY);
            var posSoundZf = Math.floor(posSoundZ);
            var posFishXf = Math.floor(posFishX);
            var posFishYf = Math.floor(posFishY);
            var posFishZf = Math.floor(posFishZ);
            var posMinusZ = (posFishZf - posSoundZf);
            var posMinusX = (posFishXf - posSoundXf);
            var posMinusZabs = Math.abs(posFishZf - posSoundZf);
            var posMinusXabs = Math.abs(posFishXf - posSoundXf);
            console.log("posMinusX = " + posMinusX);
            console.log("posMinusZ = " + posMinusZ);
            //north
            if (posMinusZ > 0 && posMinusZabs == 1 && posMinusX == 0) {
                console.log(caughtFish);
                cast = false;
                counter += 1;
                setTimeout(bot.activateItem, 50);
                setTimeout(storeInChest, 200);
            }
            //south
            if (posMinusZ < 0 && posMinusZabs == 1 && posMinusX == 0) {
                console.log(caughtFish);
                cast = false;
                counter += 1;
                setTimeout(bot.activateItem, 50);
                setTimeout(storeInChest, 200);
            }
            //east
            if (posMinusX < 0 && posMinusXabs == 1 && posMinusZ == 0) {
                console.log(caughtFish);
                cast = false;
                counter += 1;
                setTimeout(bot.activateItem, 50);
                setTimeout(storeInChest, 200);
            }
            //west
            if (posMinusX > 0 && posMinusXabs == 1 && posMinusZ == 0) {
                console.log(caughtFish);
                cast = false;
                counter += 1;
                setTimeout(bot.activateItem, 50);
                setTimeout(storeInChest, 200);
            }
            console.log("Counter: " + counter);
        }
    }
});

//functions~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function selectRod() {
    var rod = bot.inventory.findInventoryItem(346);
    var rod_count = bot.inventory.count(346);
    if (rod) {
        if (rod.metadata > 62) {
            status = 'depositing broken rod';
            console.log("Rod Count: " + rod_count);
            console.log("Meta: " + rod.metadata);
            setTimeout(function() {
                findLapis();
                console.log("Metadata: " + rod.metadata);
                console.log('Walking to chests...');
            }, 500);
        } else if (rod.metadata < 63) {
            console.log("Equipping rod in hand...");
            bot.equip(rod, 'hand');
            setTimeout(function() {
                console.log("Casting rod...");
                setTimeout(bot.activateItem, 500);
                console.log("Idle...");
                cast = true;
                status = 'fishing';
            }, 1000);
        }
        console.log(rod_count + " fishing rods, Metadata: " + rod.metadata);
        if (rod_count > 5) {
            console.log("Too many rods! May cause errors, expelling a rod.");
            bot.toss(346, null, 1, function() {
                console.log("Tossed!");
                return rod;
            });
        }
    } else if (!rod) {
        console.log('No fishing rod found, attempting to get one.');
        status = 'walking to lapis: getting rod.';
        console.log("Getting rod.")
        setTimeout(function() {
            findLapis();
        }, 500)
    }
    return rod;
}

function equipRod() {
    var rod = bot.inventory.findInventoryItem(346);
    var rod_count = bot.inventory.count(346);
    if (rod) {
        if (rod.metadata > 62) {
            setTimeout(function() {
                status = 'depositing broken rod';
                findLapis();
            }, 500);
            console.log("Metadata: " + rod.metadata);
            console.log('depositing broken rod');
            return;
        }
        console.log("Equipping rod in hand...");
        bot.equip(rod, 'hand');
    } else if (!rod) {
        console.log('No fishing rod found, attempting to get one.');
        status = 'walking to lapis: getting rod.';
        console.log("Getting rod.")
        setTimeout(function() {
            findLapis();
        }, 500)
    }
    return rod;
}

function storeInChest() {
    if (counter > 29) {
        counter = 0;
        console.log("30 fish caught, depositing into chest.");
        placeInChest();
    } else {
        async.forEach(bot.inventory.items(), function(item, done) {
            if (item.name != "fish" && item.name != "fishing_rod") {
                console.log("Tossing junk...");
                bot.tossStack(item, done);
            }
        });
        selectRod();
    }
}

function placeInChest() {
    posChest = bot.entity.position;
    //var temp = vec3(posChest.x, posChest.y + 2, posChest.z); //block above bots head
    var chestBlocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: [54, 146],
    });
    if (chestBlocks.length > 0) {
        console.log("Chest found, depositing fish...");
        var chest = bot.openChest(chestBlocks[0]);
        console.log("Chest: counting fish...");
        var fishI = bot.inventory.findInventoryItem(349);
        console.log("Chest: opening...");
        chest.on('open', function() {
            if (fishI) {
                var fishAmount = bot.inventory.count(fishI.type);
                console.log("Chest (fish): moving fish into chest...");
                chest.deposit(fishI.type, null, fishAmount, function() {
                    console.log("Chest (fish): done!");
                    chest.close();
                    findGold();
                });
            } else { //no fish
                console.log("No fish..?");
                chest.close();
                findGold();
            }
        })
    } else { //no chest
        console.log("No chest blocks found..?");
    }
}

function findGoldPlate() {
    var goldPlates = bot.findBlockSync({
        point: bot.entity.position,
        matching: 147
    });
    if (goldPlates.length > 0) {
        status = 'spawning';
        bot.navigate.to(goldPlates[0].position);
    } else {
        console.log("No gold plates found.");
        console.log("Doing base");
        bot.chat(base);
        setTimeout(function() {
            findLamp(); //possible issue
        }, 3000);
    }
}

function findLamp() {
    var lampBlocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: 123,
    });
    if (lampBlocks.length > 0) {
        status = 'walking to lamp';
        var temp = vec3(lampBlocks[0].position.x, lampBlocks[0].position.y + 2, lampBlocks[0].position.z);
        bot.navigate.to(temp);
    } else {
        console.log("No lamp found.");
        setup = true;
        bot.chat(base);
    }
}

function findRodChest() {
    var rod_count = bot.inventory.count(346);
    var rodChest = bot.findBlockSync({
        point: bot.entity.position,
        matching: 54,
    });
    if (rodChest.length > 0) {
        console.log("Opening...");
        var chest = bot.openChest(rodChest[0]);
        chest.on('open', function() {
            console.log("Chest (New): Opened!");
            chest.withdraw(346, null, 1, function() {
                console.log("Got rod.");
                status = 'walking to lamp';
                console.log("Finding nearest fishing spot...");
                chest.close();
                findLamp();
            });
        });
    } else {
        console.log("No chest found.");
        console.log("Error.");
        status = 'walking to lamp';
        findLamp();
    }
}

function findBrokenRodChest() {
    var brokenRodChest = bot.findBlockSync({
        point: bot.entity.position,
        matching: 146,
    });
    var rod = bot.inventory.findInventoryItem(346);
    var meta = rod.metadata;
    if (brokenRodChest.length > 0) {
        console.log("Chest (Broken): Opening chest.");
        var chest = bot.openChest(brokenRodChest[0]);
        chest.on('open', function() {
            console.log("Chest (Broken): Opened!");
            status = 'walking to lapis: getting rod.';
            if (keep == true) {
                chest.deposit(346, meta, 1, function() {
                    console.log("Chest (broken): Depositing rod...");
                    chest.close();
                    status = 'walking to lapis: getting rod.';
                    console.log("Chest (Broken): Done! Getting new rod...")
                    findRodChest();
                });
            } else if (keep == false) {
                bot.toss(346, meta, 1, function() {
                    chest.close();
                    status = 'walking to lapis: getting rod.';
                    console.log("Chest (Broken): Done! Getting new rod...")
                    findRodChest();
                })
            }

        });
    } else {
        console.log("No chest found..?");
        console.log("Error.");
    }
}

function findGold() {
    var goldBlocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: 41,
    });
    if (goldBlocks.length > 0) {
        status = 'finding gold';
        var botposX = bot.entity.position.x;
        var botposY = bot.entity.position.y;
        var botposZ = bot.entity.position.z;
        var sandposX = goldBlocks[0].position.x;
        var sandposY = goldBlocks[0].position.y;
        var sandposZ = goldBlocks[0].position.z;
        if (botposX < sandposX) {
            var direction = 'east';
            console.log(direction);
        } else if (botposX > sandposX) {
            var direction = 'west';
            console.log(direction);
        } else if (botposZ > sandposZ) {
            var direction = 'north';
            console.log(direction);
        } else if (botposZ < sandposZ) {
            var direction = 'south';
            console.log(direction);
        }
        switch (direction) {
            case "north":
                var hlook = 0;
                break;
            case "south":
                var hlook = Math.PI;
                break;
            case "east":
                var hlook = -1 * Math.PI / 2;
                break;
            case "west":
                var hlook = Math.PI / 2;
                break;
            default:
                console.log("Error. No direction matched.")
        }
        console.log("Found gold block, looking and casting...");
        console.log("Selecting rod...");
        console.log("Looking " + direction);
        bot.look(hlook, -0.7, true); //-0.7 needed to catch fish properly
        console.log("Selecting rod...")
        setTimeout(function() {
            selectRod();
        }, 1000);

    } else {
        console.log("No gold block found..?");
        console.log("Error.");
    }
}

function findLapis() {
    var lapisBlocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: 22,
    });
    if (lapisBlocks.length > 0) {
        console.log("walking to lapis block");
        var temp = vec3(lapisBlocks[0].position.x, lapisBlocks[0].position.y + 1, lapisBlocks[0].position.z);
        bot.navigate.to(temp);
    } else {
        console.log("No lapis block found..?");
        console.log("Error.");
    }
}

function checkBlock(id) {
    var offset = null;
    console.log("checkBlock() called...");
    var standBlock = bot.findBlockSync({
        point: bot.entity.position,
        maxDistance: 64,
        matching: id,
    });
    console.log("======block======\n" + standBlock[0] + "\n======block======");
    if (standBlock.length > 0) {
        if (id == 123) {
            offset = 2; //if redstone lamp
            console.log("offset = " + offset);
        } else {
            offset = 1; //any other block
            console.log("offset = " + offset);
        }
        console.log("Standblock length: " + standBlock.length);
        var blockPosX = Math.floor(standBlock[0].position.x);
        var blockPosY = Math.floor(standBlock[0].position.y + offset);
        var blockposZ = Math.floor(standBlock[0].position.z);
        var botPosX = Math.floor(bot.entity.position.x);
        var botPosY = Math.floor(bot.entity.position.y);
        var botPosZ = Math.floor(bot.entity.position.z);
        var tempA = vec3(blockPosX, blockPosY, blockposZ);
        var tempB = vec3(botPosX, botPosY, botPosZ);
        console.log("==TempA==\nCoords: " + tempA + "\n==TempA==");
        console.log("==TempB==\nCoords: " + tempB + "\n==TempB==");
        if (blockPosX == botPosX && blockposZ == botPosZ && blockPosY == botPosY) {
            result = true;
            console.log("Result: " + result);
        } else {
            result = false;
            console.log("Result: " + result);
        }
    }
}
