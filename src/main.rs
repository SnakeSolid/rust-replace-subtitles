// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use once_cell::sync::Lazy;
use regex::Regex;
use std::format;
use std::fs::File;
use std::io::BufRead;
use std::io::BufReader;
use std::io::BufWriter;
use std::io::Error as IoError;
use std::io::Read;
use std::io::Seek;
use std::io::SeekFrom;
use std::io::Write;
use std::path::PathBuf;
use std::writeln;
use tauri::Result as TauriResult;

const BYTE_ORDER_MASK: &str = "\u{feff}";

static REGEX_NUMBER: Lazy<Regex> = Lazy::new(|| Regex::new(r"^\d+$").unwrap());
static REGEX_INTERVAL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^\d+:\d+:\d+,\d+ --> \d+:\d+:\d+,\d+$").unwrap());

fn io_to_string(error: IoError) -> String {
    error.to_string()
}

fn non_empty_line<I>(iter: &mut I) -> Result<Option<String>, IoError>
where
    I: Iterator<Item = Result<String, IoError>>,
{
    while let Some(line) = iter.next().transpose()? {
        let line = line.trim();

        if !line.is_empty() {
            return Ok(Some(line.into()));
        }
    }

    Ok(None)
}

fn skip_bom<R>(read: &mut R) -> Result<(), IoError>
where
    R: Read + Seek,
{
    let mut data = [0; BYTE_ORDER_MASK.len()];
    let length = read.read(&mut data)?;

    if &data[0..length] != BYTE_ORDER_MASK.as_bytes() {
        read.seek(SeekFrom::Start(0))?;
    }

    Ok(())
}

#[tauri::command]
fn can_read(path: Option<PathBuf>) -> Result<bool, String> {
    match path {
        Some(path) => Ok(path.is_file()),
        None => Ok(false),
    }
}

#[tauri::command]
fn can_write(path: Option<PathBuf>) -> Result<bool, String> {
    match path {
        Some(path) if path.is_dir() => Err("Selected path is directory.".into()),
        Some(_) => Ok(true),
        None => Ok(false),
    }
}

#[tauri::command]
fn convert(subtitles: PathBuf, text: PathBuf, result: PathBuf) -> Result<(), String> {
    let mut subtitles = File::open(subtitles).map_err(io_to_string)?;
    let mut text = File::open(text).map_err(io_to_string)?;
    let result = File::create(result).map_err(io_to_string)?;

    skip_bom(&mut subtitles).map_err(io_to_string)?;
    skip_bom(&mut text).map_err(io_to_string)?;

    let subtitles = BufReader::new(subtitles);
    let mut text = BufReader::new(text).lines();
    let mut result = BufWriter::new(result);

    for subtitle_line in subtitles.lines() {
        let subtitle_line = subtitle_line.map_err(io_to_string)?;
        let subtitle_line = subtitle_line.trim();

        if subtitle_line.is_empty()
            || REGEX_NUMBER.is_match(subtitle_line)
            || REGEX_INTERVAL.is_match(subtitle_line)
        {
            writeln!(result, "{}", subtitle_line).map_err(io_to_string)?;

            continue;
        }

        if let Some(text_line) = non_empty_line(&mut text).map_err(io_to_string)? {
            writeln!(result, "{}", text_line).map_err(io_to_string)?;
        } else {
            return Err("Partially saved: number of line in text less than subtitles.".into());
        }
    }

    if let Some(_) = non_empty_line(&mut text).map_err(io_to_string)? {
        return Err("Partially saved: number of line in text greater than subtitles.".into());
    }

    Ok(())
}

fn main() -> TauriResult<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![can_read, can_write, convert])
        .run(tauri::generate_context!())
}
