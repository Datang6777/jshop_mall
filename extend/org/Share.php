<?php
namespace org;
use addons\Pintuan\model\PintuanRule;
use app\common\model\Goods;
use app\common\model\Images;
use app\common\model\User;
use org\share\PosterShare;
use org\share\UrlShare;
use org\share\QrShare;

class Share
{
    const TYPE_URL = 1;             //分享类型,url地址
    const TYPE_QR = 2;              //二维码
    const TYPE_POSTER = 3;          //海报


    /**
     * @param $client
     * @param $page
     * @param $type
     * @param $user_id
     * @param $url
     * @param $params
     * @return array
     */
    public function get($client, $page, $type, $user_id, $url, $params){
        $result = [
            'status' => true,
            'data' => [],
            'msg' => ''
        ];
        switch($type){
            case self::TYPE_URL :
                $obj = new UrlShare();
                break;
            case self::TYPE_QR :
                $obj = new QrShare();
                break;
            case self::TYPE_POSTER :
                $obj = new PosterShare();
                break;
            default:
                return error_code(10000);
        }
        $userModel = new User();
        if($user_id != 0){
            $userShareCode = $userModel->getShareCodeByUserId($user_id);
        }else{
            $userShareCode = "";
        }
        return $obj->share($client, $page, $userShareCode, $url, $params);
        return $result;
    }
}