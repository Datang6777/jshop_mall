<?php

namespace org\share;

use app\common\model\Goods;

class PosterShare extends QrShare implements BaseShare
{
    const FONT = ROOT_PATH . 'public' . DS . 'static' . DS . 'share' . DS . 'Deng.ttf';
    private $c = [
        'page_2' => [               //商品详情页
            'poster_w' => 400,
            'poster_h' => 570,
            'poster_bcolor' =>[255,255,255],
            'word' => [
                [
                    'string' => '商品名称-data2里动态设置',
                    'dst_x' => 10,
                    'dst_y' => 470,
                    'width' => 260,
                    'max_line' => 2,
                    'color' => [0,0,0],
                    'size' => 14,
                ],
                [
                    'string' => '价格-data2里动态设置',
                    'dst_x' => 10,
                    'dst_y' => 530,
                    'width' => 260,
                    'max_line' => 2,
                    'color' => [255,0,0],
                    'size' => 16,
                ],
                [
                    'string' => '扫描或长按识别二维码',
                    'dst_x' => 278,
                    'dst_y' => 555,
                    'width' => 260,
                    'max_line' => 1,
                    'color' => [0,0,0],
                    'size' => 8,
                ]
            ],
            'image' => [
                [
                    'src' => '商品主图-data2里动态设置',
                    'dst_x' => 0,
                    'dst_y' => 0,
                    'dst_w' => 400,
                    'dst_h' => 400,
                    'radius' => 0
                ],
                [
                    'src' => '二维码-data2里动态设置',
                    'dst_x' => 275,
                    'dst_y' => 420,
                    'dst_w' => 120,
                    'dst_h' => 120,
                    'radius' => 0
                ],
            ]
        ],
        'page_3' => [               //拼团
            'poster_w' => 400,
            'poster_h' => 600,
            'poster_bcolor' =>[255,255,255],
            'word' => [
                [
                    'string' => '商品名称-data2里动态设置',
                    'dst_x' => 10,
                    'dst_y' => 470,
                    'width' => 260,
                    'max_line' => 2,
                    'color' => [0,0,0],
                    'size' => 14,
                ],
                [
                    'string' => '价格-data2里动态设置',
                    'dst_x' => 10,
                    'dst_y' => 530,
                    'width' => 260,
                    'max_line' => 2,
                    'color' => [255,0,0],
                    'size' => 16,
                ],
                [
                    'string' => '扫描或长按识别二维码',
                    'dst_x' => 278,
                    'dst_y' => 555,
                    'width' => 260,
                    'max_line' => 1,
                    'color' => [0,0,0],
                    'size' => 8,
                ]
            ],
            'image' => [
                [
                    'src' => '商品主图-data2里动态设置',
                    'dst_x' => 0,
                    'dst_y' => 0,
                    'dst_w' => 400,
                    'dst_h' => 400,
                    'radius' => 0
                ],
                [
                    'src' => '二维码-data2里动态设置',
                    'dst_x' => 275,
                    'dst_y' => 420,
                    'dst_w' => 120,
                    'dst_h' => 120,
                    'radius' => 0
                ],
            ]
        ]              //拼团详情页
    ];

    public function share($client, $page, $userShareCode, $url, $params){
        $re = $this->getCode($client, $page, $userShareCode, $url, $params);
        if(!$re['status']){
            return $re;
        }
        if(!isset($this->c['page_'.$page])){
            return $this->getQr($url, $re['data']['code'],$client);
        }
//        if($client != self::CLIENT_WXMNAPP){
//            $url = $this->getUrl($url,$re['data']['code']);
//        }
        $url = urlencode($url);
        $re['data'] = url('b2c/common/poster',['client' => $client,'code' => $re['data']['code']],true,true)."?url=".$url;
        return $re;
    }

    /**
     * @param $url
     * @param $code
     * @return bool
     */
    public function poster($url,$code,$client){
        //增加缓存
        $filename = md5($url.$code.$client);
        $file_url = "static/poster/".$filename.".png";

        if(!file_exists($file_url)){
            //去生成
            $re = $this->de_url($code);
            if(!$re['status']){
                return $re;
            }

            $qr_re = $this->getQr($url,$code,$client);
            if(!$qr_re['status']){
                return $qr_re;
            }
             if(!$this->mark($re['data'],$qr_re['data'],$filename)){
                 return false;
             }
        }
        $img = file_get_contents($file_url);
        return $img;

    }
    private function mark($data,$url,$filename){
        $file_url = "static/poster/".$filename.".png";

        if(!isset($this->c['page_'.$data['page']])){
            return false;
        }
        //创建画布
        $poster = imagecreatetruecolor(
            $this->c['page_'.$data['page']]['poster_w'],
            $this->c['page_'.$data['page']]['poster_h']
        );
        $back_color = imagecolorallocate(
            $poster,
            $this->c['page_'.$data['page']]['poster_bcolor'][0],
            $this->c['page_'.$data['page']]['poster_bcolor'][1],
            $this->c['page_'.$data['page']]['poster_bcolor'][2]
        );
        imagefill($poster,0, 0, $back_color);


        switch($data['page']){
            case 1:
                $this->data1($data,$url);
                break;
            case 2:
                $this->data2($data,$url);
                break;

            case 3:
                $this->data3($data,$url);
                break;

            default:
                return false;
        }
        //添加图片
        foreach($this->c['page_'.$data['page']]['image'] as $image){
            $this->addimg(
                $poster,
                $image['src'],
                $image['dst_x'],
                $image['dst_y'],
                $image['dst_w'],
                $image['dst_h'],
                $image['radius']
            );
        }
        //添加文字
        foreach($this->c['page_'.$data['page']]['word'] as $word){
            $this->addfont(
                $poster,
                $word['dst_x'],
                $word['dst_y'],
                $word['string'],
                $word['width'],
                $word['max_line'],
                $word['color'],
                $word['size']
            );
        }
        return imagepng($poster,$file_url);               //生成PNG格式的图像
    }
    //首页海报取数据
    private function data1($data,$url){
        return true;
    }
    //商品详情页海报取数据
    private function data2($data,$url){
        if(!isset($data['params']['goods_id'])){
            return false;
        }
        $goodsModel = new Goods();
        $info = $goodsModel->field('name,image_id,price')->where('id',$data['params']['goods_id'])->find();
        if(!$info){
            unset($this->c['page_2']['image'][0]);

            return false;
        }
        $this->c['page_2']['word'][0]['string'] = $info['name'];
        $this->c['page_2']['word'][1]['string'] = "￥".$info['price'];
        $this->c['page_2']['image'][0]['src'] = _sImage($info['image_id']);
        $this->c['page_2']['image'][1]['src'] = $url;



        return true;
    }
    //拼团页海报取数据
    private function data3($data,$url){
        if(!isset($data['params']['goods_id'])){
            return false;
        }
        $goodsModel = new Goods();
        $info = $goodsModel->field('name,image_id,price')->where('id',$data['params']['goods_id'])->find();
        if(!$info){
            unset($this->c['page_2']['image'][0]);

            return false;
        }
        $this->c['page_2']['word'][0]['string'] = $info['name'];
        $this->c['page_2']['word'][1]['string'] = "￥".$info['price'];
        $this->c['page_2']['image'][0]['src'] = _sImage($info['image_id']);
        $this->c['page_2']['image'][1]['src'] = $url;



        return true;
    }

    /**
     * 添加图片
     * @author sin@20200301
     * @param $poster               画布
     * @param $img_src              图片地址，图片会根据画布上的尺寸动态的调整宽高和缩放
     * @param $dst_x                图片加到画布上的起始x坐标
     * @param $dst_y                图片加到画布上的起始y坐标
     * @param $dst_w                图片加到画布上的宽（图片在画布区域上的宽，下高相同）
     * @param $dst_h                图片加到画布上的高
     * @param $radius               圆角
     * @return bool
     */
    private function addimg(&$poster,$img_src,$dst_x, $dst_y,$dst_w,$dst_h,$radius){
        //加图片
        $img = $this->getimg($img_src,$dst_w,$dst_h,$radius);
        if(!$img){
            return false;
        }
        
        imagecopy($poster,$img['source_img'], $dst_x,$dst_y,0,0,$dst_w,$dst_h);
        return true;
    }

    /**
     * 获得外部图像信息
     * @param $url
     * @return false|resource|string
     */
    private function getimg($url,$dst_w,$dst_h,$radius){
        //计算尺寸和宽高比
        $size = $this->getimgsize($url,$dst_w, $dst_h);
        if(!$size){
            return false;
        }
        $img_string = @file_get_contents($url);
        if(!$img_string){
            return $img_string;
        }
        $source_img = imagecreatefromstring($img_string);
        //先裁剪&缩放
        $source_img = $this->cutimg($source_img,$size);
        if(!$source_img){
            return false;
        }

        if($radius > 0){
            //再圆角
            $source_img = $this->radius_img($source_img,$size['dst_w'],$size['dst_h'],$radius);
        }


        $size['source_img'] = $source_img;

        return $size;
    }


    /**
     * 图片取范围
     */
    private function getimgsize($url,$dst_w,$dst_h){
        $size = @getimagesize($url);
        if(!$size){
            return $size;
        }

        if($size[0]/$size[1] > $dst_w/$dst_h){
            //上下顶头
            $b = $size[1]/$dst_h;
            $re = [
                'src_x' => floor(($size[0] - $dst_w * $b) / 2),             //源图像x坐标  
                'src_y' => 0,                                               //源图像y坐标
                'src_w' => floor($dst_w * $b),                              //源图像宽
                'src_h' => $size[1],                                        //源图像高
                'scale' => $b,                                              //缩放比
                'dst_w' => $dst_w,                                          //画框宽度
                'dst_h' => $dst_h                                           //画框高度
            ];
        }else{
            //左右顶头
            $b = $size[0]/$dst_w;
            $re = [
                'src_x' => 0,
                'src_y' => floor(($size[1] - $dst_h * $b) / 2),
                'src_w' => $size[0],
                'src_h' => floor($dst_h * $b),
                'scale' =>$b,
                'dst_w' => $dst_w,
                'dst_h' => $dst_h                             
            ];
        }

        return $re;
    }

    //裁剪缩放
    private function cutimg($image,$size){
        $nimage = imagecreatetruecolor($size['dst_w'], $size['dst_h']);
        if(imagecopyresampled($nimage, $image, 0, 0, $size['src_x'], $size['src_y'], $size['dst_w'], $size['dst_h'], $size['src_w'], $size['src_h'])){
            return $nimage;
        }else{
            return false;
        }
    }

    /**
     * 在画布上写字
     * @author sin@20200301
     * @param $poster           画布
     * @param $x                文字的在画布上的起始x坐标
     * @param $y                文字在画布上的起始y坐标
     * @param $word             要在画布上写的文字
     * @param $width            文字在画布上最大的宽度，超过这个宽度会自动换行
     * @param $max_line         最多允许几行文字，多了就不显示，并在结尾增加$symbol
     * @param $color            文字颜色
     * @param int $size         文字尺寸
     * @param string $symbol    结尾显示的符号，默认...
     * @return bool
     */
     private function addfont(&$poster,$x,$y,$word,$width,$max_line,$color,$size = 12,$symbol = '...'){
         if(!$word){
             return false;
         }
         for ($i=0;$i<mb_strlen($word);$i++) {
             $letter[] = mb_substr($word, $i, 1);
         }
         $new_word = "";
         $line = 1;
         foreach ($letter as $l) {
             $fontBox = imagettfbbox(16, 0, self::FONT, $new_word.$l);
             if ((abs($fontBox[2] - $fontBox[0]) > $width) && ($new_word !== "")) {
                 $line++;

                 if($line <= $max_line){
                     $new_word .= "\n";
                 }else{
                     //这里最好先减掉一个字符,省的加上省略符后超出
                     $new_word = mb_substr($new_word,0,-1);
                     $new_word .= $symbol;
                     break;
                 }
             }
             $new_word .= $l;
         }
         $color = imagecolorallocate($poster,$color[0],$color[1],$color[2]);
         imagettftext($poster, $size, 0, $x, $y, $color, self::FONT, $new_word );
         return true;
     }

     /**
    * 处理四角圆图片
    * @param  string  $imgpath 源图片路径
    * @param  integer $radius  圆角半径长度默认为15,处理成圆型
    * @return [type]           [description]
    */
    private function radius_img($src_img, $w,$h,$radius = 15) {
        $img = imagecreatetruecolor($w, $h);
        //这一句一定要有
        imagesavealpha($img, true);
        //拾取一个完全透明的颜色,最后一个参数127为全透明
        $bg = imagecolorallocatealpha($img, 255, 255, 255, 127);
        imagefill($img, 0, 0, $bg);
        $r = $radius; //圆 角半径
        for ($x = 0; $x < $w; $x++) {
            for ($y = 0; $y < $h; $y++) {
                $rgbColor = imagecolorat($src_img, $x, $y);
                if (($x >= $radius && $x <= ($w - $radius)) || ($y >= $radius && $y <= ($h - $radius))) {
                    //不在四角的范围内,直接画
                    imagesetpixel($img, $x, $y, $rgbColor);
                } else {
                    //在四角的范围内选择画
                    //上左
                    $y_x = $r; //圆心X坐标
                    $y_y = $r; //圆心Y坐标
                    if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($r * $r))) {
                        imagesetpixel($img, $x, $y, $rgbColor);
                    }
                    //上右
                    $y_x = $w - $r; //圆心X坐标
                    $y_y = $r; //圆心Y坐标
                    if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($r * $r))) {
                        imagesetpixel($img, $x, $y, $rgbColor);
                    }
                    //下左
                    $y_x = $r; //圆心X坐标
                    $y_y = $h - $r; //圆心Y坐标
                    if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($r * $r))) {
                        imagesetpixel($img, $x, $y, $rgbColor);
                    }
                    //下右
                    $y_x = $w - $r; //圆心X坐标
                    $y_y = $h - $r; //圆心Y坐标
                    if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($r * $r))) {
                        imagesetpixel($img, $x, $y, $rgbColor);
                    }
                }
            }
        }
        return $img;
    }
}
