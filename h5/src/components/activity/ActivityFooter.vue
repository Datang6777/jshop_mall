<template>
    <div class="goodsdetailfooter">
        <div class="goodsdetailfooter-left">
            <div class="customservice" @click="showChat">
                <img src="../../../static/image/customservice.png"/>
                <p>客服</p>
            </div>
            <div class="goods-cart" @click="collection" v-show="!is_fav">
                <img src="../../../static/image/star.png"/>
                <p>收藏</p>
            </div>
            <div class="goods-cart" @click="collection" v-show="is_fav">
                <img src="../../../static/image/redstar.png"/>
                <p>取消收藏</p>
            </div>
            <router-link tag="div" class="star" to="/cart">
                <img src="../../../static/image/goods-cart.png"/>
                <yd-badge type="danger" v-if="cart_nums">{{ cart_nums }}</yd-badge>
                <p>购物车</p>
            </router-link>
        </div>
        <div class="goodsdetailfooter-right">
            <div class="kill">
                <yd-button type="danger" @click.native="buyNow">{{ label }}</yd-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        is_fav: {
            type: Boolean,
            default () {
                return false
            }
        },
        label: {
            type: String,
            default () {
                return ''
            }
        },
        cart_nums: {
            type: Number,
            default () {
                return 0
            }
        }
    },
    methods: {
        buyNow () {
            this.$emit('buyNow')
        },
        collection () {
            this.$emit('collection')
        },
        showChat () {
            let _this = this
            window._AIHECONG('ini', {
                entId: _this.GLOBAL.hecong(),
                button: false,
                appearance: {
                    panelMobile: {
                        tone: '#FF3B44',
                        sideMargin: 30,
                        ratio: 'part',
                        headHeight: 50
                    }
                }
            })
            window._AIHECONG('showChat')
        }
    }
}
</script>

<style>
</style>
