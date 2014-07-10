<?php

# Directory Index (dirindex.php)
#
# Reads the current directory's content and displays it as
# HTML.  Useful if file listing is denied by the web server
# configuration.
#
# Installation:
# * Put in any directory you like on your PHP-capable webspace.
# * Rename to 'index.php' if you like it to get called if no
#   file is specified in the URL (e.g. www.example.com/files/).
# * Fit the design to your needs just using HTML and CSS.
#
# Changes since original release (25-Mar-2002):
# * simplified and modernized markup and styles (HTML5, CSS3,
#   list instead of table)
# * more functional programming approach
# * improved configurability
# * escaping of HTML characters
# * license changed from GPL to MIT
# * requires PHP 5.3.0 or later
#
# Version: 25-May-2011
# Copyright (c) 2002, 2011 Jochen Kupperschmidt
# Released under the terms of the MIT license
# <http://www.opensource.org/licenses/mit-license.php>


### configuration

# Show the local path. Disable this for security reasons.
define('SHOW_PATH', false);

# Show a link to the parent directory ('..').
define('SHOW_PARENT_LINK', false);

# Show "hidden" directories and files, i.e. those whose names
# start with a dot.
define('SHOW_HIDDEN_ENTRIES', false);

### /configuration


function get_grouped_entries($path) {
    list($dirs, $files) = collect_directories_and_files($path);
    $files = filter_files($files);
	return array_fill_keys($files, FALSE);
}

function collect_directories_and_files($path) {
    # Retrieve directories and files inside the given path.
    # Also, `scandir()` already sorts the directory entries.
    $entries = scandir($path);
    return array_partition($entries);
}

function array_partition($array) {
    # Partition elements of an array into two arrays according
    # to the boolean result from evaluating the predicate.
    $results = array_fill_keys(array(1, 0), array());
    foreach ($array as $element) {
        array_push(
            $results[(int) is_dir($element)],
            $element);
    }
    return array($results[1], $results[0]);
}

function callback_b($file) 
	{
        return !is_hidden($file)
            && substr($file, -4) != '.php';  # PHP scripts
    }

function filter_files($files) {
    # Exclude files. Adjust as necessary.
    return array_filter($files, 'callback_b');
}

function is_hidden($entry) {
    return !SHOW_HIDDEN_ENTRIES
        && substr($entry, 0, 1) == '.'  # Name starts with a dot.
        && $entry != '.'  # Ignore current directory.
        && $entry != '..';  # Ignore parent directory.
}

$subdir = 'tracks/';
$path = dirname(__FILE__) . '/' . $subdir . '/';
$entries = get_grouped_entries($path);

foreach ($entries as $entry => $is_dir) {
    $escaped_entry = htmlspecialchars($entry);
    printf('<a style="width: 100%%;" id="%s" href="#">%s</a>' . "\n", $subdir.$escaped_entry, $escaped_entry);
}
?>
