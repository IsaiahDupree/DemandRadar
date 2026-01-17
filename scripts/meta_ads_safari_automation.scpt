-- Meta Ads Library Safari Helper
-- Opens Ad Library pages for keywords - user clicks download manually
-- Usage: osascript meta_ads_safari_automation.scpt "keyword1" "keyword2"
--        osascript meta_ads_safari_automation.scpt "report" (opens report page)

on run argv
	set mode to "search"
	set keywords to {"fitness"}
	
	if (count of argv) > 0 then
		if item 1 of argv is "report" then
			set mode to "report"
		else
			set keywords to argv
		end if
	end if
	
	tell application "Safari"
		activate
		
		if mode is "report" then
			-- Open Ad Library Report (CSV download available)
			if (count of windows) = 0 then
				make new document with properties {URL:"https://www.facebook.com/ads/library/report/"}
			else
				set URL of current tab of front window to "https://www.facebook.com/ads/library/report/"
			end if
			my waitForPageLoad()
			delay 2
			
			-- Show notification
			display notification "Click 'Download report' to get CSV" with title "Meta Ad Library Report"
			return "Opened Ad Library Report - click 'Download report' for CSV"
			
		else
			-- Open search pages for each keyword
			set baseURL to "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&search_type=keyword_unordered&q="
			
			repeat with keyword in keywords
				set encodedKeyword to my urlEncode(keyword)
				set fullURL to baseURL & encodedKeyword
				
				-- Open in new tab for each keyword after the first
				if (count of windows) = 0 then
					make new document with properties {URL:fullURL}
				else
					tell front window
						set newTab to make new tab with properties {URL:fullURL}
						set current tab to newTab
					end tell
				end if
				
				my waitForPageLoad()
				delay 2
				log "Opened: " & keyword
			end repeat
			
			display notification "Search tabs opened - browse ads manually" with title "Meta Ad Library Search"
			return "Opened " & (count of keywords) & " search tabs"
		end if
		
	end tell
end run

-- URL encode helper
on urlEncode(theText)
	set encodedText to ""
	repeat with char in characters of theText
		if char is " " then
			set encodedText to encodedText & "%20"
		else if char is in {"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "_", ".", "~"} then
			set encodedText to encodedText & char
		else
			set encodedText to encodedText & char
		end if
	end repeat
	return encodedText
end urlEncode

-- Wait for Safari page load
on waitForPageLoad()
	tell application "Safari"
		repeat 30 times
			if (do JavaScript "document.readyState" in current tab of front window) = "complete" then
				exit repeat
			end if
			delay 1
		end repeat
	end tell
end waitForPageLoad
