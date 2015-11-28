<?php

$recepient = "tbilous@gmail.com";
$sitename = "SKMEI Clock";


$comment = trim($_POST["comment"]);
$name = trim($_POST["name"]);
$phone = trim($_POST["phone"]);
$message = "Name: $name \nPhone: $phone \nComment: $comment";

$pagetitle = "New request from \"$sitename\"";
mail($recepient, $pagetitle, $message, "Content-type: text/plain; charset=\"utf-8\"\n From: $recepient");
