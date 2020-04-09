### NumberBox 数字输入框

带加减按钮的数字输入框，组件名：``uni-number-box``，代码块： uNumberBox。

**使用方式：**

在 ``script`` 中引用组件 

```javascript
import uniNumberBox from "@/components/uni-number-box/uni-number-box.vue"
export default {
    components: {uniNumberBox}
}
```

在 ``template`` 中使用组件

```html
<uni-number-box></uni-number-box>
<uni-number-box :min="0" :max="9"></uni-number-box>
<uni-number-box @change="bindChange"></uni-number-box>
```

实际效果参考：[https://github.com/dcloudio/uni-ui](https://github.com/dcloudio/uni-ui)

**NumberBox 属性说明：**

|属性名		|类型	|默认值	|说明					|
|---		|----	|---	|---					|
|value		|Number	|0		|输入框当前值			|
|min		|Number	|0		|最小值					|
|max		|Number	|100	|最大值					|
|step		|Number	|1		|每次点击改变的间隔大小	|
|disabled	|Boolean|false	|是否为禁用状态			|

**事件说明：**

|事件名称	|说明		|
|---|---|
|change	|输入框值改变时触发的事件，参数为输入框当前的 value|