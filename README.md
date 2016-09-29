# BrushTail
<a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands,bot,mpim:read,mpim:write,im:read,im:write,reactions:write,reactions:read,channels:history,channels:read&client_id=2437318132.73174124819"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

![AppVeyor](https://img.shields.io/badge/serverless%3F-yes-green.svg)
[![](https://img.shields.io/badge/awesome%3F-yes-red.svg)][vote]

[travis]: https://travis-ci.org/b4b4r07/dotfiles
[license]: ./doc/LICENSE-MIT.txt
[platform]: ./doc/OS_X.md
[vote]: https://voting-badge.herokuapp.com/vote?url=https://github.com/b4b4r07/dotfiles
[doc]: ./etc/README.md
[bitdeli]: https://bitdeli.com/free
[dotfiles]: http://b4b4r07.com/dotfiles
<p align="center">
<a name="top" href="http://www.nextfaze.com"><img src="http://i.imgur.com/QPnD0FX.png"></a>
</p>

<p align="center">
<b><a href="https://drive.google.com/a/nextfaze.com/file/d/0B22Pt-mTDOHMZmpVUW9GdUtzZ1U/view?usp=sharing">Graph</a></b>
|
<b><a href="#installing">Installing</a></b>
|
<b><a href="#deploying">Deploying</a></b>
|
<b><a href="#logging">Logging</a></b>
|
<b><a href="#team">Team</a></b>
</p>

## Overview

BrushTail monitors the politeness of a conversations and provides real-time feedback via comments and reactions.

## Installing

To add to your own slack team press  <a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands,bot,mpim:read,mpim:write,im:read,im:write,reactions:write,reactions:read,channels:history,channels:read&client_id=2437318132.73174124819"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

then /invite @Brushtail on any channels you would like him to participate in.

## Deploying from source

1. Follow the steps [here](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to configure your AWS account in the terminal
2. Create a new slack app [here](https://api.slack.com/apps?new_app=1)
3. `npm install -g serverless`
4. edit your authorize.js, the url on line 70 to your slack app id
5. `sls deploy -s prod --foxtype your_foxtype_key --token your_slack_token --secret your_slack_oauth-secret`
6. press the add to slack button for you app. Found [here](https://api.slack.com/docs/slack-button)
7. enjoy
    
## logging

Either in the AWS console or

    sls logs -f toFoxType -s prod

## Team

[<img alt="henry" src="https://avatars3.githubusercontent.com/u/5061604?v=3&s=466" width="117">](https://github.com/henrystevens) |[<img alt="paul" src="https://pbs.twimg.com/profile_images/596420075818586112/2OL4JoPF.jpg" width="117">](https://www.google.com) |[<img alt="james" src="https://bitbucket-assetroot.s3.amazonaws.com/c/photos/2015/Jul/21/1981462265-5-sidewaiise-avatar.png" width="117">](https://www.google.com)
:---: |:---: |:---: |:---: |:---: |:---: |
[Henry Stevens](https://github.com/henrystevens) |[Paul Robinson](https://www.google.com) |[James Limmer](https://www.google.com) 
