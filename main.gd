extends Node2D

const ANSWERS = preload("res://answers.json")
const STAR_HEIGHT = 180
const TIERS = ["top", "common", "uncommon", "rare", "secret"]
const METERS = [-20, 10, 30, 60, 100]
const LABELS = ["Top 3 answer", "Less common", "Uncommon", "Rare", "Secret answer!"]

@onready var stage = $Stage
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
	unlock_answer()


func show_question() -> void:
	round_label.text = "Question %d / %d" % [round_index + 1, ANSWERS.data.size()]
	question.text = ANSWERS.data[round_index]["question"]
	answer_box.text = ""
	feedback.text = "Avoid the three obvious answers. Unusual guesses send you higher."
	next.hide()


func unlock_answer() -> void:
	busy = false
	answer_box.editable = true
	submit.disabled = false
	skip.disabled = false
	answer_box.grab_focus()


func submit_answer(_typed_text: String = "") -> void:
	if busy or next.visible:
		return

	var answer = clean_answer(answer_box.text)
	if answer.is_empty():
		feedback.text = "Type an answer first."
		return

	var tier = find_tier(answer)
	if tier == -1:
		feedback.text = "That answer isn’t in this round’s list. Try another one."
		answer_box.grab_focus()
		answer_box.select_all()
		return

	lock_answer()
	var new_height = maxi(0, meters + METERS[tier])
	var change = new_height - meters
	if change == 0:
		feedback.text = "%s · 0 m (ground level)" % LABELS[tier]
	else:
		feedback.text = "%s · %+d m" % [LABELS[tier], change]

	if change > 0:
		await stage.bounce(change)
	else:
		await stage.fall(change)

	meters = new_height
	height.text = "%d m" % meters
	show_next()


func skip_question() -> void:
	if busy or next.visible:
		return

	lock_answer()
	feedback.text = "Skipped. Your height stays the same."
	show_next()


func show_next() -> void:
	busy = false
	var last_round = round_index + 1 == ANSWERS.data.size()
	next.text = "See result" if last_round else "Next question"
	next.show()
	next.grab_focus()


func lock_answer() -> void:
	busy = true
	answer_box.editable = false
	submit.disabled = true
	skip.disabled = true


func next_round() -> void:
	if busy or not next.visible:
		return

	if round_index == ANSWERS.data.size():
		get_tree().reload_current_scene()
		return

	round_index += 1
	if round_index < ANSWERS.data.size():
		show_question()
		unlock_answer()
		return

	round_label.text = "Final height"
	if meters >= STAR_HEIGHT:
		question.text = "You made it back to the stars!"
		feedback.text = "Final height: %d m. You reached the %d m goal!" % [meters, STAR_HEIGHT]
	else:
		question.text = "Jumpion is still on the way home."
		feedback.text = "Final height: %d m. You needed %d m more." % [meters, STAR_HEIGHT - meters]
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


func find_tier(answer: String) -> int:
	var round_answers: Dictionary = ANSWERS.data[round_index]
	var almost_tier = -1
	for tier in TIERS.size():
		for group in round_answers.get(TIERS[tier], []):
			for option in group.split("|"):
				var word = clean_answer(option)
				if answer == word:
					return tier
				# Only guess a typo if the nearby answers agree on the score.
				if answer.length() >= 5 and one_edit_away(answer, word):
					if almost_tier == -1:
						almost_tier = tier
					elif almost_tier != tier:
						almost_tier = -2
	return maxi(-1, almost_tier)


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
