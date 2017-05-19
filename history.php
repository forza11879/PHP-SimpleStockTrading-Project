<?php



// calling GuzzleHttp Library
    $client = new GuzzleHttp\Client();
    
    //Declare the file path of the csv file in which will save all the results from the API
    $file = 'uploads/csv/aapl.csv';
//Initialize csv file by setting its value to an empty string.
    file_put_contents($file, '');
//get data from web api link - {$symbols_str}

$stocks = $client->get("https://www.google.com/finance/historical?output=csv&q=aapl");

//add data into csv file
    file_put_contents($file, $stocks->getBody(), FILE_APPEND);

//getting data from csv file into database
//reading csv file
    $fp = fopen($file, 'r');
    $datas = array();
    while (($data = fgetcsv($fp)) !== FALSE) {

        $data['date'] = trim($data[0]);
        $data['openPrice'] = trim($data[1]);
        $data['high'] = trim($data[2]);
        $data['low'] = trim($data[3]);
        $data['closePrice'] = trim($data[4]);
        $data['volume'] = trim($data[5]);
        
        $datas[] = $data;
        
        
// insert or update the database
        DB::insertUpdate('symbols', array(
            'date' => $data[0],
            'openPrice' => $data[1],
            'high' => $data[2],
            'low' => $data[3],
            'closePrice' => $data[4],
            'volume' => $data[5]
            
        ));
    }
