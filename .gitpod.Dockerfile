# Need to add :latest, otherwise old versions (e.g. of node) are installed
FROM gitpod/workspace-full:latest

RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
RUN sudo apt-get install git-lfs
RUN git lfs install

# https://www.gitpod.io/docs/languages/javascript
RUN bash -c 'VERSION="14"     && source $HOME/.nvm/nvm.sh && nvm install $VERSION     && nvm use $VERSION && nvm alias default $VERSION'
RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix

RUN echo "\nexport PATH=$(yarn global bin):\$PATH" >> /home/gitpod/.bashrc

RUN yarn global add gitpod-env-per-project @babel/node @babel/core

RUN sudo apt-get install -y graphviz

RUN brew install gh

# Puppeteer dependencies
# RUN sudo apt-get update && sudo apt-get install -y libgtk-3-0 libx11-xcb1 libnss3 libxss1 libasound2 libgbm1 libxshmfence1

# Playwright dependencies

RUN sudo wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN sudo apt-get -q update
RUN sudo apt -y install ./google-chrome-stable_current_amd64.deb
RUN sudo apt-get -y install libnss3\
  libnspr4\
  libatk1.0-0\
  libatk-bridge2.0-0\
  libcups2\
  libdrm2\
  libxkbcommon0\
  libxcomposite1\
  libxdamage1\
  libxfixes3\
  libxrandr2\
  libgbm1\
  libgtk-3-0\
  libatspi2.0-0\
  libx11-xcb-dev

RUN sudo rm -rf /var/lib/apt/lists/*

RUN bash -c ". /home/gitpod/.sdkman/bin/sdkman-init.sh \
    && sdk update \
    && sdk install java 11.0.9-amzn \
    && sdk default java 11.0.9-amzn"