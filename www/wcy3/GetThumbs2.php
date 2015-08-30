<?php
  $from = $_SERVER['HTTP_ORIGIN'];
  $allowed = array ('http://www.yingtong360.com', 'http://diy.yingtong360.com', 'http://ed.yingtong360.com', 'http://localhost');
  if (in_array($from, $allowed))  {
    header('Access-Control-Allow-Origin: '.$_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Max-Age: 1000');
    header('Access-Control-Allow-Headers: Content-Type');
  }
  require_once 'ImageDBIO.php';
  searchThumbsByURL();
