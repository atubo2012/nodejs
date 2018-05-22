const {Wechaty} = require('wechaty');
const {Room} = require('wechaty');
const {MediaMessage} = require('wechaty');
const {Contact} = require('wechaty');


const fs = require('fs');
let ut = require('../cheerio/utils');

process.setMaxListeners(100);
/**
 * TODO:
 * 1、ok 对聊天记录的内容按照日期保存下来
 * 2、ok 将内容头CH（时间|群名|发言者-接受者）内容体CB分开
 * 3、将内容体的内容进行格式化，替换掉公众号中的格式。
 * 4、ok 配置每次从文件中读出，这样可以动态修改参数。配置内容可以在加载时，生成一个提醒任务列表，不必每次都解析配置实现。
 */

//从文件中加载配置信息
let fileContent = ut.rf('./rms.json');

let cfg = eval("(" + fileContent + ")");//将配置信息转换成对象
let forward = cfg.cfg.forward;      //订阅转发群的配置信息
if(!ut.isValidForword(forward)){ //校验主持、收听有关的群名是否合法。不合法则退出
    process.exit(1);
}
let tasks = ut.getAlerts(cfg.rms);//从配置信息中获取任务列表
let interval = cfg.cfg.interval * 1000;//0.4 *60*1000;  //设置间隔时间，用于调试时的：1分钟
console.log('初始配置:', tasks, cfg.cfg);
const filePath = cfg.cfg.filepath;



const bot = Wechaty.instance();
try {
    bot
        .on('scan', (url, code) => {
            let loginUrl = url.replace('qrcode', 'l');
            require('qrcode-terminal').generate(loginUrl);
            console.log(url, code);
        })
        .on('login', user => {
            console.log(`${user} login`, JSON.stringify(user));

            //登录成功5秒后绑定自动通知函数
            setTimeout(manageRoom.bind(this), 5000);
        })
        .on('friend', async function (contact, request) {
            /**
             * 处理好友请求可以是以下几种模式：
             * 1、自动接收好友请求（无条件）或根据输入的验证信息加好友（受邀），如可根据验证信息{request.hello}来确认是否加为好友。
             * 2、接收好友请求后给好友问候语（如声明/问卷）
             * 3、可以根据“当前账号”的不同，从参数文件中选择对应的问候语
             */
            if (request) {

                //自动接收好友请求，并输出日志和验证请求
                await request.accept();
                console.log(`Contact: ${contact.name()} send request ${request.hello}`);
                //console.log('设置别名：', await contact.alias())
                console.log('陌生状态：', await contact.stranger());
                console.log('官方状态：', await contact.official());
                console.log('特殊状态：', await contact.special());


                //根据当前用户，选择对应的问候语
                const myName = bot.self().name();
                // const myAlias = bot.self().alias();
                // console.log('bot.self.name()',myName,'bot.self.alias()',myAlias);

                //根据新好友的名字定位Contact对象，并给好友问候
                const fname = contact.name();   //新好友的名字
                const contactFindByName = await Contact.find({name: fname});
                contactFindByName.say('我是' + myName + ' Nice to meet u', '哈哈')

            }
        })

        .on('message', async function (m) {
            const contact = m.from();
            const content = m.content();
            const room = m.room();

            //文件名字和内容
            //const fname = cfg.cfg.filepath+cfg.cfg.logfilename+ut.getToday()+'.txt';

            const fname = cfg.cfg.filepath + cfg.cfg.logfilename + ut.getToday() + '.txt';
            let ct = '';

            //收到群内发的消息
            if (room) {
                //若是群内的消息，则显示群名
                ct = ut.getNow() + `:【${room.topic()}】${contact.name()}-${m.type()}:${content}`;
                console.log(ct);
                //console.log(`${room.memberList().length}-${m.type()}-${m.typeApp()}-${m.typeEx()}`)

                const fn = filePath + `【${ut.normalizeFileName(room.topic())}】`;
                let attFileName = '';

                if (m instanceof MediaMessage) {
                    const rowFileName = await ut.normalizeFileName(m.filename());
                    attFileName = fn + '-' + ut.getToday() + '-' + rowFileName.replace('.url', '.html');
                    await m.saveFile(attFileName);
                    //await console.log(`${m.mimeType()}`);
                }

                fs.appendFileSync(fn + '.txt', `${ct} \n`, 'utf-8', (err) => {
                    if (err) throw err;
                    console.log('写入文件时发生错误', err);
                });

                //A群转发到B群
                // if (/200弄/.test(room.topic())) {
                //     let toRoom = await Room.find({topic: "测试群123"});
                //     if (toRoom) {
                //         await toRoom.say(contact.name()+":"+content);
                //         //await toRoom.say(new MediaMessage(__dirname + '/image_21.png'))
                //         //await console.log(`加入用户后的人员`,JSON.stringify(keyroom.memberList()))
                //     }
                // }


                /**
                 * 向订阅了A群的B群和C群发送数据
                 * 算法：
                 * 1、遍历所有的转发规则
                 * 2、针对每条转发规则，如果是来自于from(主持群）的消息，则会转发到to（订阅群）
                 */
                forward.forEach((item) => {


                    if (item.from === room.topic()) {
                        console.log('主持群'+item.from+'收到消息');

                        //给每个订阅当前群消息的群转发
                        item.to.forEach(async (item2) => {


                            let toRoom = await Room.find({topic: item2.toString()});
                            if (toRoom) {// && item2!==item.from) {

                                if (m instanceof MediaMessage)
                                    await toRoom.say(new MediaMessage(attFileName));
                                else
                                    await toRoom.say('【' + item.from + '】' + contact.name() + "说:" + content);

                            } else {
                                console.warn(toRoom + '<-这个群不存在，请确认该群是否已改名或你已从该群退出');
                            }
                        });
                    }
                });


            } else {
                //将对我说的话格式化并保存到文件中。
                ct = ut.getNow() + `:【${contact.name()}】: ${content} \n`;
                console.log(ct);


                const fn = filePath + `【${ut.normalizeFileName(contact.name())}】`;
                ut.wf(fn+'.txt',ct);
            }


            //如果是自己发出的消息，则直接返回，否则程序将进入无限循环。
            if (m.self()) {
                return
            }

            /**根据用户发送的指令，可以做出以下响应：
             * 1、给用户回复消息，通过提问来进入问答模式。可以与带有KM的机器人对接互动。
             * 2、自动拉好友入群，根据不同的群号拉入不同的群
             * 3、根据指令调用不同的程序
             *    1）收到带特定内容的文字，转发到指定的群
             *    2）收到指令后，给指定的群发信息 ok
             *
             *    TODO:将入群、退群的指令与群的关系参数化。
             */

            if (/hello/.test(content)) {
                m.say("hello how are you")
            }
            //将用户拉入指定名字的群。TODO:为不同的活动，建立不同的群和内容，将test333和图片替换，针对不同的群，调用不同的群处理算法函数。
            if (/room/.test(content)) {
                let keyroom = await Room.find({topic: "test333"});
                if (keyroom) {
                    await keyroom.add(contact);
                    await keyroom.say("welcome!欢迎入群", contact);
                    await keyroom.say(new MediaMessage(__dirname + '/image_21.png'))
                    //await console.log(`加入用户后的人员`,JSON.stringify(keyroom.memberList()))
                }
            }
            if (/out/.test(content)) {
                let keyroom = await Room.find({topic: "test333"});
                if (keyroom) {
                    await keyroom.say("Remove from the room", contact);
                    await keyroom.del(contact)
                }
            }

            if (/sendgroup/.test(content)) {

                const grps = rms.home.rmlist;
                for (let a = 0; a < grps.length; a++) {
                    let keyroom = await Room.find({topic: grps[a]});
                    if (keyroom) {
                        await keyroom.say(content.replace('sendgroup', ''))

                        //获得某个群的所有用户（数组内是cotact对象）
                        //console.log(JSON.stringify(keyroom.memberList()))

                        //向某个群转发消息（），TODO：可以对豆腐块内容进行整合
                        // await keyroom.say(content)
                    }
                }
                // let keyroom = await Room.find({topic: "test333"})
                // if (keyroom) {
                //     await keyroom.say("Remove from the room", contact)
                //     await keyroom.del(contact)
                // }
            }
        })
        .start();
} catch (e) {
    console.error('发生异常', e);
}

/**
 * 群发管理
 * 功能：根据预定的参数，定时发送信息。
 * @returns {Promise.<void>}
 */
async function manageRoom() {
    /**
     * Find Room
     */
    try {

        const room = await  Room.find({topic: "测试群123"});
        if (room) {
            await room.say('wechaty已启动');
        } else {
            console.warn("【测试群123】尚未建立，请建立该群，以便接收通知");
        }




        /**
         * 定时读取配置文件
         * 如果任务已进入了当前时间与下次刷新所在的区间，则执行任务。
         * 支持场景：
         * 1、按时给指定的群发送通知
         * 2、收听群接受主持群的信息
         * 3、从第三方获取数据，给指定群发送
         */
        setInterval(() => {


            /**
             * 给指定的群发通知
             * 1、按时间通知
             * 2、按任务通知
             */
            //遍历任务列表，识别出应被提醒的记录，输出到控制台
            tasks.forEach((item) => {

                //若当前时间已到达或超过定时timer的时刻、且小于1分钟时，则执行。
                const td = ut.getTimeDiffrence(item.timer);
                //当前任务是否进入了时间窗口
                if (td >= 0 && td < interval) {

                    //对当前任务项下的所有群群执行任务（在这里，任务就是发送消息）
                    item.groups.forEach(async (grp) => {

                        //任务内容：找到对应的房间，发送相关的信息。
                        const room = await Room.find({topic: grp.toString()});
                        if (room) {
                            await room.say(item.content);



                            //todo:如果有handler的配置信息，则执行对应的xxxHandler函数，将并将函数的处理结果作为参数
                            if(item.handler)
                            {
                                console.log('包涵处理函数，执行处理函数');
                                let handler = eval(item.handler);
                                handler(room);
                            }

                        }
                    });
                }

            });




            /**
             * 刷新配置信息：
             * 算法：
             * 1、读取配置文件
             * 2、将配置文件转换成js对象，便于在程序中操作
             * 3、校验配置文件的规则
             */
            fileContent = ut.rf('rms.json');
            cfg = eval("(" + fileContent + ")");//将配置信息转换成对象

            //刷新配置的间隔时间
            interval = cfg.cfg.interval * 1000;

            //通知类配置
            tasks = ut.getAlerts(cfg.rms);
            //当任务列表不空，且配置规则为定时显示时，才在日志中输出任务列表
            (tasks.length !== 0 && cfg.cfg.showInterval) ? console.log(ut.getNow() + ':刷新任务列表:', tasks, cfg.cfg) : '';


            //转发类配置
            forward = cfg.cfg.forward;
            if(!ut.isValidForword(forward)){ //校验主持、收听有关的群名是否合法。
                console.error('请修改配置');
            }



        }, interval);


        // if (!room) {
        //     console.warn('Bot', 'there is no room topic ding(yet)')
        //     return
        // }
        //console.log('Bot', 'start monitor "ding" room join/leave event')

        /**
         * Event: Join
         */
        // room.on('join', function (this, inviteeList,inviter){
        //     log.verbose('Bot', 'Room EVENT: join - %s, %s',
        //         inviteeList.map(c => c.name()).join(', '),
        //         inviter.name(),
        //     );
        //     checkRoomJoin.call(this, room, inviteeList, inviter)
        // });

        /**
         * Event: Leave
         */
        // room.on('leave', (leaver) => {
        //     console.log('Bot', 'Room EVENT: leave - %s leave, byebye', leaver.name())
        // })

        /**
         * Event: Topic Change
         */
        // room.on('topic', (topic, oldTopic, changer) => {
        //     console.log('Bot', 'Room EVENT: topic - changed from %s to %s by member %s',
        //         oldTopic,
        //         topic,
        //         changer.name(),
        //     )
        // })

    } catch (e) {
        console.warn('Bot', 'Room.find rejected: %s', e.stack)
    }
}

/**
 * 功能：根据配置文件中的handler属性对应的函数名，从第三方获取数据，再向指定的群发送信息
 *
 * 场景：
 * 1、定时发送天气信息
 * 2、定时刷新最新上架订单，通知相关群关注订单
 * 3、定时刷新订单状态信息，通知某些用户关注
 *
 * 总体算法：
 * 1、从第三方获取数据
 * 2、给指定的群发送消息
 *
 * @param rm 群名称
 * @returns {Promise.<void>}
 */
async function testfunc(rm) {

    //实现从第三方获取数据的算法
    console.log('哈哈，this is testfunc');


    //对群发送消息
    await rm.say('哈哈，this is testfunc');

}

/**
 * 获取天气信息，发给指定的群
 * @param rm
 * @returns {Promise.<void>}
 */
async function weatherForcast(rm) {

    //实现从第三方获取数据的算法
    console.log('哈哈，this is weatherForcast');

    //对群发送消息
    await ut.getWeather((result)=>{
        rm.say(result);
    });

}