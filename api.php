<?php
require_once 'vendor/autoload.php';

DB::$host = 'localhost';
DB::$user = 'stocksimulator';
DB::$password = 'bUz0FlWwASZEnDgZ';
DB::$dbName = 'stocksimulator';
DB::$encoding = 'utf8';
DB::$port = 3333;

   
  $getchart = DB::query("SELECT volume, openPrice,high,low,closeprice FROM history GROUP BY idHistory DESC");

  //print_r($data);
  
  
//looping through $data
   while ($getchart !==FALSE) {
        

           // $data[0] = date('d-m-Y', strtotime($data[0]));
//            $data[0] = intval($data[0]);
//            $data[1] = floatval($data[1]);
//            $data[2] = floatval($data[2]);
//            $data[3] = floatval($data[3]);
//            $data[4] = floatval($data[4]);
            
            $getchart[0] = intval($getchart[0]);
            $getchart[1] = floatval($getchart[1]);
            $getchart[2] = floatval($getchart[2]);
            $getchart[3] = floatval($getchart[3]);
            $getchart[4] = floatval($getchart[4]);
            
        
         //Create an array 
            $chartArray[] = $getchart;
            
      
    }
    
    //print_r($chartArray);

    //Convert PHP Array to reverse JSON String
   
    print (json_encode($chartArray));
  


?>

