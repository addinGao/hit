var NebPay = require("nebpay")
var nebPay = new NebPay();
var dappAddress = "n1eGnFkZRrAUx7a8nPKaYBGf7GU58Y3kC9D"

var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var Account = require("nebulas").Account;
var Transaction = require("nebulas").Transaction;
var Unit = require("nebulas").Unit;
var neb = new Neb();
neb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
// neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));
var timersss,xunhuan;
class Game {
  constructor (fps = 60) {
    let g = {
      actions: {},                                                  // 记录按键动作
      keydowns: {},                                                 // 记录按键keycode
      state: 1,                                                     // 游戏状态值，初始默认为1
      state_START: 1,                                               // 开始游戏
      state_RUNNING: 2,                                             // 游戏开始运行
      state_STOP: 3,                                                // 暂停游戏
      state_GAMEOVER: 4,                                            // 游戏结束
      state_UPDATE: 5,                                              // 游戏通关
      canvas: document.getElementById("canvas"),                    // canvas元素
      context: document.getElementById("canvas").getContext("2d"),  // canvas画布
      timer: null,                                                  // 轮询定时器
      fps: fps,                                                     // 动画帧数，默认60
    }
    Object.assign(this, g)
  }
  // 绘制页面所有素材
  draw (paddle, ball, blockList, score) {
    let g = this
    // 清除画布
    g.context.clearRect(0, 0, g.canvas.width, g.canvas.height)
    // 绘制背景图
    g.drawBg()
    // 绘制挡板
    g.drawImage(paddle)
    // 绘制小球
    g.drawImage(ball)
    // 绘制砖块
    g.drawAllBlock(blockList)
    // 绘制分数
    g.drawText(score)
  }
  // 绘制图片
  drawImage (obj) {
    this.context.drawImage(obj.image, obj.x, obj.y)
  }
  // 绘制背景图
  drawBg () {
    let bg = imageFromPath(allImg.background)
    this.context.drawImage(bg, 0, 0)
  }
  // 绘制所有砖块
  drawAllBlock (list) {
    for (let item of list) {
      this.drawImage(item)
    }
  }
  // 绘制计数板
  drawText (obj) {
    this.context.font = '24px Microsoft YaHei'
    this.context.fillStyle = '#fff'
    // 绘制分数
    this.context.fillText(obj.text + obj.allScore, obj.x, obj.y)
    // 绘制关卡
    this.context.fillText(obj.textLv + obj.lv, this.canvas.width - 100, obj.y)
  }
  // 游戏结束
  gameOver (scores) {
    // 清除定时器
    clearInterval(this.timer)
    // 清除画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // 绘制背景图
    this.drawBg()
    // 绘制提示文字
    this.context.font = '30px Microsoft YaHei'
		this.context.fillStyle = '#fff'
		scores = "游戏结束，得分"+scores+"分"
    this.context.fillText(scores, 404, 226)
  }
  // 游戏晋级
  goodGame () {
    // 清除定时器
    clearInterval(this.timer)
    // 清除画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // 绘制背景图
    this.drawBg()
    // 绘制提示文字
    this.context.font = '48px Microsoft YaHei'
    this.context.fillStyle = '#fff'
    this.context.fillText('恭喜晋级下一关卡', 308, 226)
  }
  // 游戏通关
  finalGame () {
    // 清除定时器
    clearInterval(this.timer)
    // 清除画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // 绘制背景图
    this.drawBg()
    // 绘制提示文字
    this.context.font = '48px Microsoft YaHei'
    this.context.fillStyle = '#fff'
    this.context.fillText('恭喜通关全部关卡', 308, 226)
  }
  // 注册事件
  registerAction (key, callback) {
    this.actions[key] = callback
  }
  // 小球碰撞砖块检测
  checkBallBlock (g, paddle, ball, blockList, score) {
    let p = paddle, b = ball
    // 小球碰撞挡板检测
    if (p.collide(b)) {
      // 当小球运动方向趋向挡板中心时，Y轴速度取反，反之则不变
      if (Math.abs(b.y + b.h/2 - p.y + p.h/2) > Math.abs(b.y + b.h/2 + b.speedY - p.y + p.h/2)) {
        b.speedY *= -1
      } else {
        b.speedY *= 1
      }
      // 设置X轴速度
      b.speedX = p.collideRange(b)
    }
    // 小球碰撞砖块检测
    blockList.forEach(function (item, i, arr) {
      if (item.collide(b)) { // 小球、砖块已碰撞
        if (!item.alive) { // 砖块血量为0时，进行移除
          arr.splice(i, 1)
        }
        // 当小球运动方向趋向砖块中心时，速度取反，反之则不变
        if ((b.y < item.y && b.speedY < 0) || (b.y > item.y && b.speedY > 0)) {
          if (!item.collideBlockHorn(b)) {
            b.speedY *= -1
          } else { // 当小球撞击砖块四角时，Y轴速度不变
            b.speedY *= 1
          }
        } else {
          b.speedY *= 1
        }
        // 当小球撞击砖块四角时，X轴速度取反
        if (item.collideBlockHorn(b)) {
          b.speedX *= -1
        }
        // 计算分数
        score.computeScore()
      }
    })
    // 挡板移动时边界检测
    if (p.x <= 0) { // 到左边界时
      p.isLeftMove = false
    } else {
      p.isLeftMove = true
    }
    if (p.x >= 1000 - p.w) { // 到右边界时
      p.isRightMove = false
    } else {
      p.isRightMove = true
    }
    // 移动小球
    b.move(g)
  }
  // 设置逐帧动画
  setTimer (paddle, ball, blockList, score) {
    let g = this
    // let p = paddle
    // let b = ball
    g.timer = setInterval(function () {
			// actions集合
			
      let actions = Object.keys(g.actions)
      for (let i = 0; i < actions.length; i++) {
        let key = actions[i]
        if(g.keydowns[key]) {
          // 如果按键被按下，调用注册的action
          g.actions[key]()
        }
      }
      // 当砖块数量为0时，挑战成功
      if (blockList.length == 0) {
        // 升级通关
        g.state = g.state_UPDATE
        // 挑战成功，渲染下一关卡场景
        g.goodGame()
      }
      // 判断游戏是否结束
      if (g.state === g.state_GAMEOVER) {
        g.gameOver(score.allScore)
      }
      // 判断游戏开始时执行事件
      if (g.state === g.state_RUNNING) {
        g.checkBallBlock(g, paddle, ball, blockList, score)
        // 绘制游戏所有素材
        g.draw(paddle, ball, blockList, score)
      } else if (g.state === g.state_START){
        // 绘制游戏所有素材
        g.draw(paddle, ball, blockList, score)
      }
    }, 1000/g.fps)
  }
  /**
   * 初始化函数
   * _main: 游戏入口函数对象
   */
  init (_main) {
    let g = this,
        paddle = _main.paddle,
        ball = _main.ball,
        blockList = _main.blockList,
        score = _main.score
    // 设置键盘按下及松开相关注册函数
    window.addEventListener('keydown', function (event) {
     g.keydowns[event.keyCode] = true
    })
    window.addEventListener('keyup', function (event) {
      g.keydowns[event.keyCode] = false
    })
    g.registerAction = function (key, callback) {
      g.actions[key] = callback
    }
    // 注册左方向键移动事件
    g.registerAction('37', function(){
      // 判断游戏是否处于运行阶段
      if (g.state === g.state_RUNNING && paddle.isLeftMove) {
        paddle.moveLeft()
      }
    })
    // 注册右方向键移动事件
    g.registerAction('39', function(){
      // 判断游戏是否处于运行阶段
      if (g.state === g.state_RUNNING && paddle.isRightMove) {
        paddle.moveRight()
      }
    })
    // window.addEventListener('keydown', function (event) {
    //   switch (event.keyCode) {
    //     // 注册空格键发射事件
    //     case 32 :
    //       if (g.state === g.state_GAMEOVER) { // 游戏结束时
    //         // 开始游戏
    //         g.state = g.state_START
    //         // 初始化
    //         _main.start()
    //       } else { 
    //         // 开始游戏
    //         ball.fired = true
    //         g.state = g.state_RUNNING
    //       }
    //       break
    //     // N 键进入下一关卡
    //     case 78 :
    //       // 游戏状态为通关，且不为最终关卡时
    //       if (g.state === g.state_UPDATE && _main.LV !== MAXLV) { // 进入下一关
    //         // 开始游戏
    //         g.state = g.state_START
    //         // 初始化下一关卡
    //         _main.start(++_main.LV)
    //       } else if (g.state === g.state_UPDATE && _main.LV === MAXLV) { // 到达最终关卡
    //         g.finalGame()
    //       }
    //       break
    //     // P 键暂停游戏事件
    //     case 80 :
    //       g.state = g.state_STOP
    //       break
    //   }
		// })
		// 点击按钮触发相应的事件
		$("#start").click(function(){
			 // 开始游戏
			 // 往session里存一个数
			console.log(sessionStorage.getItem("isStart"))
			if (!sessionStorage.getItem("isStart")){
				var callArgs = "[\"" + "begin"  + "\"]";
				nebPay.call(dappAddress,"0","begin",callArgs,{
					listener:begin
				})
			}else{
				ball.fired = true
				g.state = g.state_RUNNING
			}
		})
		function begin(res){
			var txhash = res.txhash;
			$(".mask").fadeIn(500);
			 if(txhash){
				 testTransitionStatus(txhash,function(){
					 sessionStorage.setItem("isStart",true)
					 var i = 3;
					 xunhuan = setInterval(function(){
						 if(i<=0){
							 clearInterval(xunhuan)
						 }
						 $(".mask").html(i)
						 i--
					 },1000)
					 setTimeout(function(){
					  	$(".mask").fadeOut(10);
							ball.fired = true
							g.state = g.state_RUNNING
					 },4000)
				 })
			 }
	 }
		$("#reset").click(function(){
			// 开始游戏
				g.state = g.state_START
				// 初始化
				_main.start()
		})
		$("#pause").click(function(){
			console.log(g)
			// return;
			g.state = g.state_STOP
		})
		$("#next").click(function(){
		
		
				if (g.state === g.state_UPDATE && _main.LV !== MAXLV) { // 进入下一关
					// 开始游戏
					g.state = g.state_START
					// 初始化下一关卡
					_main.start(++_main.LV)
				} else if (g.state === g.state_UPDATE && _main.LV === MAXLV) { // 到达最终关卡
					g.finalGame()
				}
			
		})
		$("#addRank").click(function(){
			jQuery(".ranks").fadeIn(500);
		})
		$("#ranks").click(function(){
			nebPay.simulateCall(dappAddress,"0","getOrder","",{
					listener:getOrders
			})
		})
		// 点击取消
		$(".cancal").click(function(){
			jQuery(".ranks").fadeOut(10);
		})
		
		$(".quxiao").click(function(){
			$(".rankContent").fadeOut()
		})
		// 点击提交
		console.log(document.querySelector(".submit"))
		document.querySelector(".submit").onclick=function(){
			var name = jQuery("#name").val()
			console.log(name);
			if(name.trim()){
					//  拿到最高分数
				var scoresHi =score.allScore
				console.log(score);
				var name = jQuery("#name").val() || "匿名"
				var callArgs = "[\"" + name + "\",\"" + scoresHi + "\"]";
					nebPay.call(dappAddress,"0","order",callArgs,{
						listener:order
				})
			}
		}
		function order(res){
			console.log(res)
			var txhash = res.txhash;
			jQuery(".ranks").fadeOut(500);
			
			if(txhash){
				jQuery(".mask").fadeIn(500)
				jQuery(".mask").html("请稍等...")
				timersss = setInterval(function(){
						neb.api.getTransactionReceipt({hash:txhash}).then(function (res) { 
								if(res.status === 1){
									clearInterval(timersss)
									jQuery(".mask").fadeOut(500)
									setTimeout(function(){
										 tipss("提交成功","green",1000);
									},500)
								}
						})
				},2000)
			}
		}
    // 设置轮询定时器
    g.setTimer(paddle, ball, blockList, score)
	}
}

function testTransitionStatus(txhash,callback){
	timersss = setInterval(function(){
			neb.api.getTransactionReceipt({hash:txhash}).then(function (res) { 
					if(res.status === 1){
						clearInterval(timersss)
						if(callback){
							callback()
						}
						return 
					}
			})
	},2000)
}
function tipss(text,background,time){
	var html = jQuery(".g-oks");
	html.html(text)
	background = background || "green"
	time = time || 1000
	html.css("backgroundColor",background)
	html.fadeIn(500);
	setTimeout(function(){
		jQuery(".g-oks").fadeOut(1000)
	},time)
}
function getOrders(res){
	console.log(res)
	$(".rankContent").fadeIn()
	if(res.result){
		res = JSON.parse(res.result)
		res = JSON.parse(res)
		console.log(res)
		var ul = jQuery("#rankss");
		var str = "";
		if(res !== 0){
			 var len = res.length;
			 if(len>5){
				 len =5;
			 }
			 for(var i=0;i<len;i++){
					if(i===0){
						str +=` <li class="first">
						<img src="./img/one.png" alt=""> 
						${res[i].name}：${res[i].score}分</li>`
					}else if (i===1){
						str +=` <li class="second">
						<img src="./img/one2.png" alt=""> 
						${res[i].name}：${res[i].score}分</li>`
					}else if(i===2){
						str +=` <li class="three">
						<img src="./img/one3.png" alt=""> 
						${res[i].name}：${res[i].score}分</li>`
					}else{
						str +=`	<li class="paddings">
						${res[i].name}：${res[i].score}分
									</li>`
					}
			 }
			 ul.html(str);
		}
	}
}
function changeRankContent(){
	getOrder()
}