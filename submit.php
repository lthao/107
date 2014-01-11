<?php
	include("config.php");
	$blue_Y = $_POST["blue_Y"];
	$red_Y = $_POST["red_Y"];

	$insert_query = "INSERT INTO `c_cs147_lao793`.`blocks` (`blue_Y`, `red_Y`) 
	           VALUES ('$blue_Y', '$red_Y') ";
	$insert_result = mysql_query($insert_query);
?>