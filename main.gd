extends Node2D

const STAR_HEIGHT = 180
const BOUNCE_MINIMUM = 30
const ANSWER_TYPES = {
	"top": {"meters": -20, "label": "Top 3 answer"},
	"common": {"meters": 10, "label": "Less common"},
	"uncommon": {"meters": 30, "label": "Uncommon"},
	"rare": {"meters": 60, "label": "Rare"},
	"secret": {"meters": 100, "label": "Secret answer!"},
}

@onready var questions: Array = preload("res://answers.json").data
@onready var stage = $Stage
@onready var hud: CanvasLayer = $HUD
@onready var question: Label = $HUD/Panel/Question
@onready var round_label: Label = $HUD/Panel/Round
@onready var answer_box: LineEdit = $HUD/Panel/Answer
@onready var submit: Button = $HUD/Panel/Submit
@onready var skip: Button = $HUD/Panel/Skip
@onready var next: Button = $HUD/Panel/Next
@onready var feedback: Label = $HUD/Panel/Feedback
@onready var height: Label = $HUD/Height
@onready var goal: Label = $HUD/Goal

var round_index = 0
var meters = 0
var busy = true


func _ready() -> void:
	goal.text = "Goal: %d m" % STAR_HEIGHT
	show_question()
	await stage.intro()
	hud.show()
	stage.say("How do I get back up?")
	unlock_answer()


func show_question() -> void:
	round_label.text = "Question %d / %d" % [round_index + 1, questions.size()]
	question.text = questions[round_index]["question"]
	answer_box.text = ""
	feedback.text = "Avoid the three obvious answers. Unusual guesses send you higher."
	next.hide()


func unlock_answer() -> void:
	set_answer_enabled(true)
	answer_box.grab_focus()


func submit_answer(_typed_text: String = "") -> void:
	if busy or next.visible:
		return

	var answer = clean_answer(answer_box.text)
	if answer.is_empty():
		feedback.text = "Type an answer first."
		return

	var tier = find_tier(answer)
	if tier.is_empty():
		feedback.text = "That answer isn't on the list. Try another one."
		answer_box.grab_focus()
		answer_box.select_all()
		return

	set_answer_enabled(false)
	stage.say("")
	var result: Dictionary = ANSWER_TYPES[tier]
	var new_height = maxi(0, meters + result["meters"])
	var change = new_height - meters
	if change == 0:
		feedback.text = "%s: 0 m (ground level)" % result["label"]
	else:
		feedback.text = "%s: %+d m" % [result["label"], change]

	if change > 0:
		var use_trampoline = change >= BOUNCE_MINIMUM
		await stage.climb(change, use_trampoline)
		stage.say("That worked!" if use_trampoline else "A little higher.")
	else:
		await stage.fall(change)
		stage.say("Oops. Let's try again.")

	meters = new_height
	height.text = "%d m" % meters
	show_next()


func skip_question() -> void:
	if busy or next.visible:
		return

	set_answer_enabled(false)
	feedback.text = "Skipped. Your height stays the same."
	show_next()


func show_next() -> void:
	busy = false
	var last_round = round_index + 1 == questions.size()
	next.text = "See result" if last_round else "Next question"
	next.show()
	next.grab_focus()


func set_answer_enabled(enabled: bool) -> void:
	busy = not enabled
	answer_box.editable = enabled
	submit.disabled = not enabled
	skip.disabled = not enabled


func next_round() -> void:
	if busy or not next.visible:
		return

	if round_index == questions.size():
		get_tree().reload_current_scene()
		return

	round_index += 1
	if round_index < questions.size():
		show_question()
		unlock_answer()
		return

	round_label.text = "Final height"
	if meters >= STAR_HEIGHT:
		question.text = "You made it back to the stars!"
		feedback.text = "Final height: %d m. You reached the %d m goal!" % [meters, STAR_HEIGHT]
		stage.say("I made it!")
	else:
		question.text = "Jumpion is still on the way home."
		feedback.text = "Final height: %d m. You needed %d m more." % [meters, STAR_HEIGHT - meters]
		stage.say("I'll try again.")
	answer_box.hide()
	submit.hide()
	skip.hide()
	next.text = "Play again"


func clean_answer(raw: String) -> String:
	var cleaned = ""
	for letter in raw.to_lower().strip_edges():
		if letter in "abcdefghijklmnopqrstuvwxyz0123456789 ":
			cleaned += letter
		elif letter == "-":
			cleaned += " "
	cleaned = " ".join(cleaned.split(" ", false))
	for article in ["a ", "an ", "the "]:
		if cleaned.begins_with(article):
			return cleaned.substr(article.length())
	return cleaned


func find_tier(answer: String) -> String:
	var round_answers: Dictionary = questions[round_index]
	var nearby_tiers: Array[String] = []
	for tier: String in ANSWER_TYPES:
		for group in round_answers.get(tier, []):
			for option in group.split("|"):
				var word = clean_answer(option)
				if answer == word:
					return tier
				if answer.length() >= 5 and tier not in nearby_tiers and one_edit_away(answer, word):
					nearby_tiers.append(tier)
	# Accept a typo when every close answer gets the same score.
	return nearby_tiers[0] if nearby_tiers.size() == 1 else ""


func one_edit_away(answer: String, word: String) -> bool:
	if absi(answer.length() - word.length()) > 1:
		return false

	var left = 0
	while left < mini(answer.length(), word.length()) and answer[left] == word[left]:
		left += 1

	if answer.length() == word.length():
		if answer.substr(left + 1) == word.substr(left + 1):
			return true
		# A pair of letters typed in the wrong order.
		return (left + 1 < word.length() and answer[left] == word[left + 1]
			and answer[left + 1] == word[left] and answer.substr(left + 2) == word.substr(left + 2))
	if answer.length() > word.length():
		return answer.substr(left + 1) == word.substr(left)
	return answer.substr(left) == word.substr(left + 1)
